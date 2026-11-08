const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { authMiddleware } = require("../config/auth");
const { notifyStatusChange } = require("../utils/notify");
const { paginate } = require("../utils/paginate");
const { canReadOrder } = require("../utils/orderAccess");

const SELECT_BASE = `
  SELECT co.*, c.client_id, c.tracking_number AS commande_tracking_number, c.client_name, c.client_phone,
         c.status AS commande_status, u.full_name AS agent_name
  FROM colis co
  JOIN commandes c ON c.id = co.commande_id
  LEFT JOIN users u ON u.id = co.agent_id`;

// GET /api/colis — filtres optionnels : search, status, page, limit
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { search, status, page, limit } = req.query;
    const conditions = [];
    const params = [];

    if (req.user.role === "agent") {
      conditions.push("co.agent_id = ?"); params.push(req.user.id);
    } else if (req.user.role === "client") {
      conditions.push("c.client_id = ?"); params.push(req.user.id);
    }
    if (search) {
      conditions.push("(co.tracking_number ILIKE ? OR c.client_name ILIKE ? OR co.destination ILIKE ?)");
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (status) { conditions.push("co.status = ?"); params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const selectSql = `${SELECT_BASE} ${where} ORDER BY co.created_at DESC`;
    const countSql = `SELECT COUNT(*) AS count FROM colis co JOIN commandes c ON c.id = co.commande_id ${where}`;

    const result = await paginate(db, { selectSql, countSql, params, page, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/colis/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(`${SELECT_BASE} WHERE co.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Colis introuvable" });
    const colis = rows[0];
    if (!canReadOrder(req.user, colis)) return res.status(403).json({ error: "Accès refusé" });
    res.json(colis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/colis/history/:colis_id
router.get("/history/:colis_id", authMiddleware, async (req, res) => {
  try {
    const { rows: cRows } = await db.query(
      "SELECT co.agent_id, c.client_id FROM colis co JOIN commandes c ON c.id = co.commande_id WHERE co.id = ?",
      [req.params.colis_id]
    );
    if (!cRows.length) return res.status(404).json({ error: "Colis introuvable" });
    if (!canReadOrder(req.user, cRows[0])) return res.status(403).json({ error: "Accès refusé" });
    const { rows } = await db.query(
      `SELECT ch.*, u.full_name AS changed_by_name
       FROM colis_history ch
       LEFT JOIN users u ON u.id = ch.changed_by
       WHERE ch.colis_id = ? ORDER BY ch.created_at ASC`,
      [req.params.colis_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/colis — convertit une commande confirmée en colis
router.post("/", authMiddleware, async (req, res) => {
  const { commande_id, weight, dimensions, destination, carrier, photo_url } = req.body;
  if (!commande_id) return res.status(400).json({ error: "commande_id requis" });
  if (!["admin", "agent"].includes(req.user.role)) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  try {
    const { rows: commandeRows } = await db.query("SELECT * FROM commandes WHERE id = ?", [commande_id]);
    if (!commandeRows.length) return res.status(404).json({ error: "Commande introuvable" });
    const commande = commandeRows[0];
    if (req.user.role === "agent" && commande.agent_id !== req.user.id) {
      return res.status(403).json({ error: "Accès refusé" });
    }
    if (commande.status === "registered") {
      return res.status(400).json({ error: "La commande doit être confirmée avant de devenir un colis" });
    }
    const { rows: existing } = await db.query("SELECT id FROM colis WHERE commande_id = ?", [commande_id]);
    if (existing.length) return res.status(409).json({ error: "Cette commande a déjà un colis" });

    const id = uuidv4();
    await db.query(
      `INSERT INTO colis (id, commande_id, tracking_number, weight, dimensions, destination, carrier, photo_url, agent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, commande_id, commande.tracking_number, weight || commande.weight || 0, dimensions || null,
        destination || commande.address_to, carrier || null, photo_url || null, commande.agent_id]
    );
    await db.query(
      "INSERT INTO colis_history (id, colis_id, status, description, changed_by) VALUES (?, ?, 'recu', 'Colis créé', ?)",
      [uuidv4(), id, req.user.id]
    );
    const { rows } = await db.query(`${SELECT_BASE} WHERE co.id = ?`, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/colis/:id
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM colis WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Colis introuvable" });
    const colis = rows[0];
    if (req.user.role === "agent" && colis.agent_id !== req.user.id) {
      return res.status(403).json({ error: "Accès refusé" });
    }
    if (!["admin", "agent"].includes(req.user.role)) {
      return res.status(403).json({ error: "Accès refusé" });
    }
    const allowed = ["status", "photo_url", "weight", "dimensions", "destination", "carrier"];
    const fields = Object.keys(req.body).filter((k) => allowed.includes(k));
    if (!fields.length) return res.status(400).json({ error: "Aucun champ valide" });

    const set = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => req.body[f]);
    await db.query(`UPDATE colis SET ${set}, updated_at = NOW() WHERE id = ?`, [...values, req.params.id]);

    if (req.body.status && req.body.status !== colis.status) {
      await db.query(
        "INSERT INTO colis_history (id, colis_id, status, description, changed_by) VALUES (?, ?, ?, ?, ?)",
        [uuidv4(), req.params.id, req.body.status, req.body.description || "", req.user.id]
      );

      const { rows: cRows } = await db.query(
        "SELECT id, tracking_number, client_id FROM commandes WHERE id = ?",
        [colis.commande_id]
      );
      if (cRows.length) {
        await notifyStatusChange(db, {
          recipients: [cRows[0].client_id, colis.agent_id],
          actorId: req.user.id,
          commandeId: cRows[0].id,
          trackingNumber: cRows[0].tracking_number,
          title: `Colis ${cRows[0].tracking_number}`,
          message: req.body.description || `Nouveau statut du colis : ${req.body.status}`,
          status: req.body.status,
        });
      }
    }

    const { rows: updated } = await db.query(`${SELECT_BASE} WHERE co.id = ?`, [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
