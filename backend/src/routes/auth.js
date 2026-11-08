const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { authMiddleware } = require("../config/auth");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { full_name, email, password, phone } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: "Champs requis manquants" });
  }
  try {
    const { rows: existing } = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email déjà utilisé" });
    }
    const id = uuidv4();
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (id, full_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, 'client')",
      [id, full_name, email, hash, phone || null]
    );
    const token = jwt.sign({ id, email, role: "client" }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    res.status(201).json({ token, user: { id, full_name, email, role: "client" } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }
  try {
    const { rows } = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }
    if (user.status === "suspended") {
      return res.status(403).json({ error: "Compte suspendu — contactez l'administrateur" });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ token, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — infos complètes du compte connecté (le login/register ne renvoient pas le téléphone)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, full_name, email, role, phone, status, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/me — modifier son propre nom/téléphone, et/ou changer son mot de passe
router.patch("/me", authMiddleware, async (req, res) => {
  const { full_name, phone, current_password, new_password } = req.body;
  try {
    const fields = [];
    const values = [];
    if (full_name && full_name.trim()) { fields.push("full_name = ?"); values.push(full_name.trim()); }
    if (phone !== undefined) { fields.push("phone = ?"); values.push(phone || null); }
    if (new_password) {
      if (!current_password) return res.status(400).json({ error: "Mot de passe actuel requis" });
      if (new_password.length < 6) return res.status(400).json({ error: "Le nouveau mot de passe doit faire au moins 6 caractères" });
      const { rows } = await db.query("SELECT password_hash FROM users WHERE id = ?", [req.user.id]);
      const valid = await bcrypt.compare(current_password, rows[0].password_hash);
      if (!valid) return res.status(400).json({ error: "Mot de passe actuel incorrect" });
      const hash = await bcrypt.hash(new_password, 10);
      fields.push("password_hash = ?"); values.push(hash);
    }
    if (!fields.length) return res.status(400).json({ error: "Aucun champ valide" });

    await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, [...values, req.user.id]);
    const { rows: updated } = await db.query(
      "SELECT id, full_name, email, role, phone, status, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
