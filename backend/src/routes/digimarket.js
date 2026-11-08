const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { authMiddleware, adminOnly } = require("../config/auth");
const { notifyUser } = require("../utils/notify");

// GET /api/digimarket/me — candidature agent de l'utilisateur connecté (ou null)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM digimarket_profiles WHERE user_id = ?", [req.user.id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Champs collectés pour étudier la fiabilité du candidat avant validation admin
const APPLICATION_FIELDS = [
  "id_card_url", "id_card_number", "selfie_url",
  "country", "city", "address",
  "occupation", "motivation",
  "emergency_contact_name", "emergency_contact_phone",
];
const REQUIRED_LABELS = {
  id_card_url: "la carte d'identité", id_card_number: "le numéro de la carte d'identité", selfie_url: "le selfie avec la carte d'identité",
  country: "le pays", city: "la ville", address: "l'adresse",
  occupation: "la profession", motivation: "la motivation",
  emergency_contact_name: "le nom du contact d'urgence", emergency_contact_phone: "le téléphone du contact d'urgence",
};

// POST /api/digimarket/me — soumettre une candidature complète pour devenir agent
router.post("/me", authMiddleware, async (req, res) => {
  const missing = APPLICATION_FIELDS.filter((f) => !req.body[f] || !String(req.body[f]).trim());
  if (missing.length) {
    return res.status(400).json({ error: `Champ requis manquant : ${REQUIRED_LABELS[missing[0]]}` });
  }
  try {
    const { rows: existing } = await db.query("SELECT id FROM digimarket_profiles WHERE user_id = ?", [req.user.id]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Une candidature existe déjà" });
    }
    const id = uuidv4();
    const values = APPLICATION_FIELDS.map((f) => req.body[f].trim());
    await db.query(
      `INSERT INTO digimarket_profiles (id, user_id, ${APPLICATION_FIELDS.join(", ")}, status)
       VALUES (?, ?, ${APPLICATION_FIELDS.map(() => "?").join(", ")}, 'pending')`,
      [id, req.user.id, ...values]
    );
    const { rows } = await db.query("SELECT * FROM digimarket_profiles WHERE id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/digimarket/me — mettre à jour sa propre candidature (uniquement tant qu'elle est en attente ou rejetée)
router.patch("/me", authMiddleware, async (req, res) => {
  const fields = APPLICATION_FIELDS.filter((f) => req.body[f] !== undefined && String(req.body[f]).trim());
  if (!fields.length) return res.status(400).json({ error: "Aucun champ valide" });
  try {
    const { rows: existing } = await db.query("SELECT * FROM digimarket_profiles WHERE user_id = ?", [req.user.id]);
    if (!existing.length) return res.status(404).json({ error: "Candidature introuvable" });
    if (existing[0].status === "active") {
      return res.status(400).json({ error: "Candidature déjà validée, plus modifiable" });
    }
    const set = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => req.body[f].trim());
    await db.query(
      `UPDATE digimarket_profiles SET ${set}, status = 'pending', updated_at = NOW() WHERE user_id = ?`,
      [...values, req.user.id]
    );
    const { rows } = await db.query("SELECT * FROM digimarket_profiles WHERE user_id = ?", [req.user.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/digimarket — admin : liste des candidatures, filtrable par statut
router.get("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const conditions = [];
    const params = [];
    if (status) { conditions.push("dm.status = ?"); params.push(status); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await db.query(
      `SELECT dm.*, u.full_name, u.email, u.phone
       FROM digimarket_profiles dm
       JOIN users u ON u.id = dm.user_id
       ${where}
       ORDER BY dm.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/digimarket/:id/status — admin approuve (=> devient agent) ou rejette une candidature
router.patch("/:id/status", authMiddleware, adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!["active", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Statut invalide" });
  }
  try {
    const { rows } = await db.query("SELECT * FROM digimarket_profiles WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Candidature introuvable" });

    await db.query("UPDATE digimarket_profiles SET status = ?, updated_at = NOW() WHERE id = ?", [status, req.params.id]);
    if (status === "active") {
      await db.query("UPDATE users SET role = 'agent' WHERE id = ?", [rows[0].user_id]);
    }
    await notifyUser(db, rows[0].user_id, {
      title: status === "active" ? "Candidature validée" : "Candidature rejetée",
      message: status === "active"
        ? "Votre candidature agent a été validée, vous pouvez maintenant générer des liens d'affiliation."
        : "Votre candidature agent a été rejetée. Vous pouvez soumettre une nouvelle demande.",
    });

    const { rows: updated } = await db.query("SELECT * FROM digimarket_profiles WHERE id = ?", [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
