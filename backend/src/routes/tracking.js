const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { authMiddleware, optionalAuth } = require("../config/auth");
const { canReadOrder, editRestriction } = require("../utils/orderAccess");
const { notifyStatusChange } = require("../utils/notify");
const { creditCommissionIfDelivered } = require("../utils/commission");

// Données personnelles ou commerciales : jamais envoyées à un visiteur anonyme,
// seulement à l'admin, l'agent responsable ou le client propriétaire connecté.
const PRIVATE_FIELDS = [
  "client_name", "address_from", "address_to", "price", "tax",
  "colis_destination", "colis_photo_url", "event_description",
];

// GET /api/tracking/:tracking_number — public : statuts et dates uniquement ; détail complet si propriétaire connecté
router.get("/:tracking_number", optionalAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
        c.client_id, c.agent_id,
        c.tracking_number, c.client_name, c.address_from, c.address_to,
        c.package_type, c.status, c.price, c.tax, c.weight, c.volume,
        c.delivery_mode, c.city, c.created_at AS order_created_at,
        c.estimated_arrival,
        th.status AS event_status, th.description AS event_description,
        th.created_at AS event_date,
        co.status AS colis_status, co.carrier AS colis_carrier,
        co.destination AS colis_destination, co.photo_url AS colis_photo_url
       FROM commandes c
       LEFT JOIN tracking_history th ON th.commande_id = c.id
       LEFT JOIN colis co ON co.commande_id = c.id
       WHERE c.tracking_number = ?
       ORDER BY th.created_at DESC`,
      [req.params.tracking_number]
    );
    if (!rows.length) return res.status(404).json({ error: "Colis introuvable" });
    const full = canReadOrder(req.user, rows[0]);
    res.json(rows.map(({ client_id, agent_id, ...row }) => {
      if (full) return row;
      for (const f of PRIVATE_FIELDS) delete row[f];
      return row;
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tracking/subscribe — abonnement email public (pas d'auth) pour suivre un numéro de suivi
router.post("/subscribe", async (req, res) => {
  const { tracking_number, email } = req.body;
  if (!tracking_number || !email) {
    return res.status(400).json({ error: "Numéro de suivi et email requis" });
  }
  try {
    const { rows } = await db.query("SELECT id FROM commandes WHERE tracking_number = ?", [tracking_number]);
    if (!rows.length) return res.status(404).json({ error: "Numéro de suivi introuvable" });
    await db.query(
      "INSERT INTO notification_subscriptions (id, tracking_number, email) VALUES (?, ?, ?) ON CONFLICT (tracking_number, email) DO NOTHING",
      [uuidv4(), tracking_number, email]
    );
    res.status(201).json({ message: "Abonnement enregistré" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tracking/history/:commande_id
router.get("/history/:commande_id", authMiddleware, async (req, res) => {
  try {
    const { rows: oRows } = await db.query("SELECT agent_id, client_id FROM commandes WHERE id = ?", [req.params.commande_id]);
    if (!oRows.length) return res.status(404).json({ error: "Commande introuvable" });
    if (!canReadOrder(req.user, oRows[0])) return res.status(403).json({ error: "Accès refusé" });
    const { rows } = await db.query(
      `SELECT th.*, u.full_name AS changed_by_name
       FROM tracking_history th
       LEFT JOIN users u ON u.id = th.changed_by
       WHERE th.commande_id = ?
       ORDER BY th.created_at ASC`,
      [req.params.commande_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tracking/history
router.post("/history", authMiddleware, async (req, res) => {
  const { commande_id, status, description } = req.body;
  if (!commande_id || !status) {
    return res.status(400).json({ error: "commande_id et status requis" });
  }
  try {
    const { rows: oRows } = await db.query("SELECT agent_id, client_id, affiliate_link_id FROM commandes WHERE id = ?", [commande_id]);
    if (!oRows.length) return res.status(404).json({ error: "Commande introuvable" });
    const denied = editRestriction(req.user, oRows[0], ["status"]);
    if (denied) return res.status(403).json({ error: denied });

    const id = uuidv4();
    await db.query(
      "INSERT INTO tracking_history (id, commande_id, status, description, changed_by) VALUES (?, ?, ?, ?, ?)",
      [id, commande_id, status, description || "", req.user.id]
    );
    await db.query(
      "UPDATE commandes SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, commande_id]
    );
    await creditCommissionIfDelivered(commande_id, status);

    const { rows: cRows } = await db.query("SELECT tracking_number, client_id, agent_id FROM commandes WHERE id = ?", [commande_id]);
    if (cRows.length) {
      await notifyStatusChange(db, {
        recipients: [cRows[0].client_id, cRows[0].agent_id],
        actorId: req.user.id,
        commandeId: commande_id,
        trackingNumber: cRows[0].tracking_number,
        title: `Commande ${cRows[0].tracking_number}`,
        message: description || `Nouveau statut : ${status}`,
        status,
      });
    }

    res.status(201).json({ id, commande_id, status, description, changed_by: req.user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
