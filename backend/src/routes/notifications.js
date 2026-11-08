const router = require("express").Router();
const db = require("../config/db");
const { authMiddleware } = require("../config/auth");
const { paginate } = require("../utils/paginate");

router.use(authMiddleware);

// GET /api/notifications — sans `page` : les 50 plus récentes (utilisé par la cloche).
// Avec `page`/`limit`/`unread` : liste paginée complète (utilisée par la page Notifications).
router.get("/", async (req, res) => {
  try {
    const { page, limit, unread } = req.query;
    const conditions = ["user_id = ?"];
    const params = [req.user.id];
    if (unread === "true") conditions.push("is_read = false");
    const where = `WHERE ${conditions.join(" AND ")}`;
    const selectSql = `SELECT * FROM notifications ${where} ORDER BY created_at DESC${page ? "" : " LIMIT 50"}`;
    const countSql = `SELECT COUNT(*) AS count FROM notifications ${where}`;

    const result = await paginate(db, { selectSql, countSql, params, page, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications/unread-count
router.get("/unread-count", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = false",
      [req.user.id]
    );
    res.json({ count: Number(rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false", [req.user.id]);
    res.json({ message: "Notifications marquées comme lues" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  try {
    const { rows } = await db.query("UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ? RETURNING *", [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: "Notification introuvable" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
