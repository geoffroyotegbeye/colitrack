const router = require("express").Router();
const db = require("../config/db");
const { authMiddleware, adminOnly } = require("../config/auth");
const { paginate } = require("../utils/paginate");
const { notifyUser } = require("../utils/notify");

// GET /api/agents — filtres optionnels : page, limit
router.get("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { page, limit } = req.query;
    const selectSql = "SELECT id, full_name, email, phone, status, created_at FROM users WHERE role = 'agent' ORDER BY full_name";
    const countSql = "SELECT COUNT(*) AS count FROM users WHERE role = 'agent'";
    const result = await paginate(db, { selectSql, countSql, params: [], page, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/agents/:id/status — suspendre / réactiver un agent
router.patch("/:id/status", authMiddleware, adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!["active", "suspended"].includes(status)) {
    return res.status(400).json({ error: "Statut invalide" });
  }
  try {
    await db.query("UPDATE users SET status = ? WHERE id = ? AND role = 'agent'", [status, req.params.id]);
    await notifyUser(db, req.params.id, {
      title: status === "suspended" ? "Compte suspendu" : "Compte réactivé",
      message: status === "suspended"
        ? "Votre compte a été suspendu par un administrateur."
        : "Votre compte a été réactivé, vous avez de nouveau accès à la plateforme.",
    });
    res.json({ message: status === "suspended" ? "Agent suspendu" : "Agent réactivé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agents/:id/stats — performance d'affiliation (clics, commandes générées, commission due/payée)
router.get("/:id/stats", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin" && req.user.id !== req.params.id) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  try {
    const { rows } = await db.query(
      `SELECT
         COALESCE(SUM(al.clicks), 0) AS clicks,
         COUNT(c.id) FILTER (WHERE c.id IS NOT NULL) AS orders_count,
         COUNT(c.id) FILTER (WHERE c.status = 'delivered') AS delivered_count,
         COALESCE(SUM(c.commission_amount) FILTER (WHERE c.commission_paid_at IS NULL), 0) AS commission_due,
         COALESCE(SUM(c.commission_amount) FILTER (WHERE c.commission_paid_at IS NOT NULL), 0) AS commission_paid
       FROM affiliate_links al
       LEFT JOIN commandes c ON c.affiliate_link_id = al.id
       WHERE al.agent_id = ?`,
      [req.params.id]
    );
    res.json({
      clicks: Number(rows[0].clicks),
      orders_count: Number(rows[0].orders_count),
      delivered_count: Number(rows[0].delivered_count),
      commission_due: Number(rows[0].commission_due),
      commission_paid: Number(rows[0].commission_paid),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agents/:id/activity — dernières commandes générées via les liens d'affiliation de cet agent
router.get("/:id/activity", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin" && req.user.id !== req.params.id) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  try {
    const { rows } = await db.query(
      `SELECT c.id, c.tracking_number, c.product, c.status, c.price,
              c.commission_amount, c.commission_paid_at, c.created_at
       FROM commandes c
       WHERE c.agent_id = ?
       ORDER BY c.created_at DESC LIMIT 15`,
      [req.params.id]
    );
    res.json(rows.map((r) => ({
      ...r,
      price: Number(r.price),
      commission_amount: r.commission_amount != null ? Number(r.commission_amount) : null,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agents/:id/commandes
router.get("/:id/commandes", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM commandes WHERE agent_id = ? ORDER BY created_at DESC",
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/agents/:id/role
router.patch("/:id/role", authMiddleware, adminOnly, async (req, res) => {
  const { role } = req.body;
  if (!["admin", "agent", "client"].includes(role)) {
    return res.status(400).json({ error: "Rôle invalide" });
  }
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "Vous ne pouvez pas modifier votre propre rôle" });
  }
  try {
    await db.query("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);
    res.json({ message: "Rôle mis à jour" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
