const router = require("express").Router();
const db = require("../config/db");
const { authMiddleware, adminOnly } = require("../config/auth");
const { paginate } = require("../utils/paginate");
const { notifyUser } = require("../utils/notify");

// GET /api/users — tous les utilisateurs, tous rôles confondus (admin uniquement)
// filtres optionnels : search, role, page, limit
router.get("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { search, role, page, limit } = req.query;
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push("(full_name ILIKE ? OR email ILIKE ?)");
      const like = `%${search}%`;
      params.push(like, like);
    }
    if (role) { conditions.push("role = ?"); params.push(role); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const selectSql = `SELECT id, full_name, email, phone, role, status, created_at FROM users ${where} ORDER BY created_at DESC`;
    const countSql = `SELECT COUNT(*) AS count FROM users ${where}`;

    const result = await paginate(db, { selectSql, countSql, params, page, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/status — suspendre / réactiver n'importe quel compte
router.patch("/:id/status", authMiddleware, adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!["active", "suspended"].includes(status)) {
    return res.status(400).json({ error: "Statut invalide" });
  }
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "Vous ne pouvez pas modifier votre propre statut" });
  }
  try {
    const { rows } = await db.query("UPDATE users SET status = ? WHERE id = ? RETURNING role", [status, req.params.id]);
    if (rows[0]?.role === "agent") {
      await notifyUser(db, req.params.id, {
        title: status === "suspended" ? "Compte suspendu" : "Compte réactivé",
        message: status === "suspended"
          ? "Votre compte a été suspendu par un administrateur."
          : "Votre compte a été réactivé, vous avez de nouveau accès à la plateforme.",
      });
    }
    res.json({ message: status === "suspended" ? "Compte suspendu" : "Compte réactivé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
