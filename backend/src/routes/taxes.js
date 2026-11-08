const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { authMiddleware, adminOnly } = require("../config/auth");

// GET /api/taxes/rate — public (donnée non sensible), utilisé aussi par la fiche produit pour afficher le détail du prix à un visiteur anonyme
router.get("/rate", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT rate, default_commission_rate, updated_at FROM tax_settings ORDER BY updated_at DESC LIMIT 1");
    res.json({
      rate: rows.length ? Number(rows[0].rate) : 0,
      default_commission_rate: rows.length ? Number(rows[0].default_commission_rate) : 10,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/taxes/rate — admin uniquement ; met à jour le taux de taxe et/ou le taux de commission par défaut
router.patch("/rate", authMiddleware, adminOnly, async (req, res) => {
  const { rate, default_commission_rate } = req.body;
  if (rate === undefined && default_commission_rate === undefined) {
    return res.status(400).json({ error: "Aucun champ valide" });
  }
  if (rate !== undefined && (isNaN(Number(rate)) || Number(rate) < 0)) {
    return res.status(400).json({ error: "Taux de taxe invalide" });
  }
  if (default_commission_rate !== undefined && (isNaN(Number(default_commission_rate)) || Number(default_commission_rate) < 0)) {
    return res.status(400).json({ error: "Taux de commission invalide" });
  }
  try {
    const { rows } = await db.query("SELECT * FROM tax_settings ORDER BY updated_at DESC LIMIT 1");
    const current = rows[0] || { rate: 0, default_commission_rate: 10 };
    const newRate = rate !== undefined ? rate : current.rate;
    const newCommission = default_commission_rate !== undefined ? default_commission_rate : current.default_commission_rate;
    if (rows.length) {
      await db.query(
        "UPDATE tax_settings SET rate = ?, default_commission_rate = ?, updated_by = ?, updated_at = NOW() WHERE id = ?",
        [newRate, newCommission, req.user.id, rows[0].id]
      );
    } else {
      await db.query(
        "INSERT INTO tax_settings (id, rate, default_commission_rate, updated_by) VALUES (?, ?, ?, ?)",
        [uuidv4(), newRate, newCommission, req.user.id]
      );
    }
    res.json({ rate: Number(newRate), default_commission_rate: Number(newCommission) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const TRANSPORT_MODES = ["standard", "express", "maritime", "aerien"];

// GET /api/taxes/transport-rates — lu par admin et agent
router.get("/transport-rates", authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT mode, rate_per_kg, delay_min_days, delay_max_days FROM transport_rates ORDER BY mode");
    res.json(rows.map((r) => ({
      mode: r.mode,
      rate_per_kg: Number(r.rate_per_kg),
      delay_min_days: r.delay_min_days,
      delay_max_days: r.delay_max_days,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/taxes/transport-rates — admin uniquement ; met à jour les 4 tarifs en un seul appel
router.patch("/transport-rates", authMiddleware, adminOnly, async (req, res) => {
  const { rates } = req.body;
  if (!Array.isArray(rates) || !rates.length) return res.status(400).json({ error: "Aucun tarif fourni" });
  for (const r of rates) {
    if (!TRANSPORT_MODES.includes(r.mode)) return res.status(400).json({ error: `Mode invalide : ${r.mode}` });
    if ([r.rate_per_kg, r.delay_min_days, r.delay_max_days].some((v) => v !== undefined && Number(v) < 0)) {
      return res.status(400).json({ error: "Les tarifs et délais ne peuvent pas être négatifs" });
    }
  }
  try {
    for (const r of rates) {
      await db.query(
        `UPDATE transport_rates SET rate_per_kg = ?, delay_min_days = ?, delay_max_days = ?, updated_at = NOW() WHERE mode = ?`,
        [r.rate_per_kg || 0, r.delay_min_days || 0, r.delay_max_days || 0, r.mode]
      );
    }
    const { rows } = await db.query("SELECT mode, rate_per_kg, delay_min_days, delay_max_days FROM transport_rates ORDER BY mode");
    res.json(rows.map((r) => ({
      mode: r.mode,
      rate_per_kg: Number(r.rate_per_kg),
      delay_min_days: r.delay_min_days,
      delay_max_days: r.delay_max_days,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
