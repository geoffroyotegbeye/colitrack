const router = require("express").Router();
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { authMiddleware, adminOnly } = require("../config/auth");
const { notifyUser } = require("../utils/notify");

const genCode = () => crypto.randomBytes(5).toString("hex");

// anti-spam clics : un même visiteur (code + IP) ne compte qu'une fois par fenêtre de temps
const CLICK_DEDUP_WINDOW_MS = 5 * 60 * 1000;
const recentClicks = new Map(); // `${code}:${ip}` -> timestamp du dernier clic compté

function shouldCountClick(code, ip) {
  const key = `${code}:${ip}`;
  const now = Date.now();
  for (const [k, ts] of recentClicks) {
    if (now - ts > CLICK_DEDUP_WINDOW_MS) recentClicks.delete(k);
  }
  const last = recentClicks.get(key);
  if (last && now - last < CLICK_DEDUP_WINDOW_MS) return false;
  recentClicks.set(key, now);
  return true;
}

// GET /api/affiliate/resolve/:code — résolution publique d'un lien (page produit + achat), incrémente les clics
router.get("/resolve/:code", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT al.id, al.code, al.product_id, al.agent_id, p.*,
         COALESCE((
           SELECT json_agg(gi.image_url ORDER BY gi.created_at)
           FROM saved_product_images gi WHERE gi.saved_product_id = p.id
         ), '[]') AS images
       FROM affiliate_links al
       JOIN saved_products p ON p.id = al.product_id
       WHERE al.code = ?`,
      [req.params.code]
    );
    if (!rows.length) return res.status(404).json({ error: "Lien introuvable" });
    if (rows[0].status !== "active") return res.status(404).json({ error: "Produit indisponible" });
    if (shouldCountClick(req.params.code, req.ip)) {
      await db.query("UPDATE affiliate_links SET clicks = clicks + 1 WHERE code = ?", [req.params.code]);
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use(authMiddleware);

// POST /api/affiliate/links — génère (ou renvoie) le lien d'affiliation de l'agent pour un produit du catalogue.
// Réservé aux agents déjà validés (candidature DigiMarket approuvée) — plus d'auto-promotion silencieuse.
router.post("/links", async (req, res) => {
  if (req.user.role !== "agent") {
    return res.status(403).json({ error: "Réservé aux agents validés. Soumettez une candidature depuis \"Devenir agent\"." });
  }
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: "product_id requis" });
  try {
    const { rows: prodRows } = await db.query(
      "SELECT id, is_global, status FROM saved_products WHERE id = ?", [product_id]
    );
    if (!prodRows.length || !prodRows[0].is_global || prodRows[0].status !== "active") {
      return res.status(404).json({ error: "Produit introuvable" });
    }

    const { rows: existing } = await db.query(
      "SELECT * FROM affiliate_links WHERE product_id = ? AND agent_id = ?",
      [product_id, req.user.id]
    );
    let link = existing[0];
    if (!link) {
      const id = uuidv4();
      const code = genCode();
      await db.query(
        "INSERT INTO affiliate_links (id, code, product_id, agent_id) VALUES (?, ?, ?, ?)",
        [id, code, product_id, req.user.id]
      );
      const { rows } = await db.query("SELECT * FROM affiliate_links WHERE id = ?", [id]);
      link = rows[0];
    }

    res.status(201).json({ link, authRefresh: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/affiliate/links/mine — mes liens, avec produit, clics, commandes attribuées et gains (dû vs payé)
router.get("/links/mine", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT al.id, al.code, al.clicks, al.created_at,
              p.id AS product_id, p.name AS product_name, p.default_price, p.main_image_url,
              COUNT(c.id) FILTER (WHERE c.id IS NOT NULL) AS orders_count,
              COUNT(c.id) FILTER (WHERE c.commission_amount IS NOT NULL) AS delivered_count,
              COALESCE(SUM(c.commission_amount) FILTER (WHERE c.commission_paid_at IS NULL), 0) AS total_due,
              COALESCE(SUM(c.commission_amount) FILTER (WHERE c.commission_paid_at IS NOT NULL), 0) AS total_paid,
              COALESCE(SUM(CASE WHEN c.commission_amount IS NULL AND c.status != 'delivered' THEN 1 ELSE 0 END), 0) AS pending_count
       FROM affiliate_links al
       JOIN saved_products p ON p.id = al.product_id
       LEFT JOIN commandes c ON c.affiliate_link_id = al.id
       WHERE al.agent_id = ?
       GROUP BY al.id, p.id
       ORDER BY al.created_at DESC`,
      [req.user.id]
    );
    res.json(rows.map((r) => ({
      ...r,
      orders_count: Number(r.orders_count),
      delivered_count: Number(r.delivered_count),
      pending_count: Number(r.pending_count),
      total_due: Number(r.total_due),
      total_paid: Number(r.total_paid),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/affiliate/agents/summary — admin : total dû / payé par agent affilié
router.get("/agents/summary", adminOnly, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id AS agent_id, u.full_name, u.email,
              COALESCE(SUM(c.commission_amount) FILTER (WHERE c.commission_paid_at IS NULL), 0) AS total_due,
              COALESCE(SUM(c.commission_amount) FILTER (WHERE c.commission_paid_at IS NOT NULL), 0) AS total_paid
       FROM affiliate_links al
       JOIN users u ON u.id = al.agent_id
       LEFT JOIN commandes c ON c.affiliate_link_id = al.id
       GROUP BY u.id
       HAVING COALESCE(SUM(c.commission_amount), 0) > 0
       ORDER BY total_due DESC`
    );
    res.json(rows.map((r) => ({ ...r, total_due: Number(r.total_due), total_paid: Number(r.total_paid) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/affiliate/agents/:agentId/pay — admin : marque comme payées toutes les commissions dues de cet agent
router.post("/agents/:agentId/pay", adminOnly, async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE commandes c SET commission_paid_at = NOW()
       FROM affiliate_links al
       WHERE c.affiliate_link_id = al.id AND al.agent_id = ?
         AND c.commission_amount IS NOT NULL AND c.commission_paid_at IS NULL
       RETURNING c.id, c.commission_amount`,
      [req.params.agentId]
    );
    const total = rows.reduce((s, r) => s + Number(r.commission_amount), 0);
    if (total > 0) {
      await notifyUser(db, req.params.agentId, {
        title: "Commission payée",
        message: `${total.toLocaleString()} F ont été marqués comme payés`,
      });
    }
    res.json({ paid_count: rows.length, total_paid: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
