const router = require("express").Router();
const db = require("../config/db");
const { authMiddleware } = require("../config/auth");
const { paginate } = require("../utils/paginate");

router.use(authMiddleware, (req, res, next) => {
  if (!["admin", "agent"].includes(req.user.role)) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  next();
});

// GET /api/clients — annuaire clients agrégé depuis les commandes (par téléphone).
// admin: tous les clients ; agent: ses propres clients. Filtres optionnels : search, page, limit
router.get("/", async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const conditions = [];
    const params = [];

    if (req.user.role === "agent") {
      conditions.push("c.agent_id = ?"); params.push(req.user.id);
    }
    if (search) {
      conditions.push("(c.client_name ILIKE ? OR c.client_phone ILIKE ?)");
      const like = `%${search}%`;
      params.push(like, like);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const selectSql = `
      SELECT
        c.client_phone AS phone,
        (SELECT c2.client_name FROM commandes c2 WHERE c2.client_phone = c.client_phone ORDER BY c2.created_at DESC LIMIT 1) AS name,
        COUNT(*) AS orders_count,
        COALESCE(SUM(c.price), 0) AS total_spent,
        MIN(c.created_at) AS first_order_at,
        MAX(c.created_at) AS last_order_at,
        BOOL_OR(c.client_id IS NOT NULL) AS has_account
      FROM commandes c
      ${where}
      GROUP BY c.client_phone
      ORDER BY MAX(c.created_at) DESC`;
    const countSql = `SELECT COUNT(DISTINCT c.client_phone) AS count FROM commandes c ${where}`;

    const result = await paginate(db, { selectSql, countSql, params, page, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/:phone/orders — historique complet d'un client (role-scoped)
router.get("/:phone/orders", async (req, res) => {
  try {
    const conditions = ["c.client_phone = ?"];
    const params = [req.params.phone];
    if (req.user.role === "agent") {
      conditions.push("c.agent_id = ?"); params.push(req.user.id);
    }
    const { rows } = await db.query(
      `SELECT c.* FROM commandes c WHERE ${conditions.join(" AND ")} ORDER BY c.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
