const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { authMiddleware, adminOnly } = require("../config/auth");
const { paginate } = require("../utils/paginate");

// GET /api/categories — lu par admin et agent (sélecteur produit). Filtres optionnels : search, page, limit
router.get("/", authMiddleware, async (req, res) => {
  if (!["admin", "agent"].includes(req.user.role)) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  try {
    const { search, page, limit } = req.query;
    const where = search ? "WHERE name ILIKE ?" : "";
    const params = search ? [`%${search}%`] : [];
    const selectSql = `SELECT * FROM categories ${where} ORDER BY name`;
    const countSql = `SELECT COUNT(*) AS count FROM categories ${where}`;
    const result = await paginate(db, { selectSql, countSql, params, page, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/categories — admin uniquement
router.post("/", authMiddleware, adminOnly, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Nom requis" });
  try {
    const id = uuidv4();
    await db.query("INSERT INTO categories (id, name) VALUES (?, ?)", [id, name.trim()]);
    const { rows } = await db.query("SELECT * FROM categories WHERE id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Cette catégorie existe déjà" });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/categories/:id — admin uniquement
router.patch("/:id", authMiddleware, adminOnly, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Nom requis" });
  try {
    await db.query("UPDATE categories SET name = ? WHERE id = ?", [name.trim(), req.params.id]);
    const { rows } = await db.query("SELECT * FROM categories WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Catégorie introuvable" });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Cette catégorie existe déjà" });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/categories/:id — admin uniquement
router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.query("DELETE FROM categories WHERE id = ?", [req.params.id]);
    res.json({ message: "Catégorie supprimée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
