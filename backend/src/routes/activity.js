const router = require("express").Router();
const db = require("../config/db");
const { authMiddleware, adminOnly } = require("../config/auth");
const { paginate } = require("../utils/paginate");

const BASE_SQL = `
  SELECT th.id, 'commande' AS type, c.id AS ref_id, c.tracking_number AS ref, th.status, th.description,
         th.created_at, u.full_name AS changed_by_name, c.agent_id, a.full_name AS agent_name
  FROM tracking_history th
  JOIN commandes c ON c.id = th.commande_id
  LEFT JOIN users u ON u.id = th.changed_by
  LEFT JOIN users a ON a.id = c.agent_id
  UNION ALL
  SELECT ch.id, 'colis' AS type, co.id AS ref_id, co.tracking_number AS ref, ch.status, ch.description,
         ch.created_at, u.full_name AS changed_by_name, co.agent_id, a.full_name AS agent_name
  FROM colis_history ch
  JOIN colis co ON co.id = ch.colis_id
  LEFT JOIN users u ON u.id = ch.changed_by
  LEFT JOIN users a ON a.id = co.agent_id`;

// GET /api/activity — journal d'activité global (tous agents/commandes/colis), admin uniquement
// filtres optionnels : search, type, agent_id, page, limit
router.get("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { search, type, agent_id, page, limit } = req.query;
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push("(ref ILIKE ? OR description ILIKE ? OR changed_by_name ILIKE ?)");
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (type) { conditions.push("type = ?"); params.push(type); }
    if (agent_id) { conditions.push("agent_id = ?"); params.push(agent_id); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const selectSql = `SELECT * FROM (${BASE_SQL}) activity ${where} ORDER BY created_at DESC`;
    const countSql = `SELECT COUNT(*) AS count FROM (${BASE_SQL}) activity ${where}`;

    const result = await paginate(db, { selectSql, countSql, params, page, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
