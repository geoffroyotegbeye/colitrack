const { v4: uuidv4 } = require("uuid");
const { pushToUser } = require("../ws");

async function insertNotification(db, { userId, title, message, commandeId = null, trackingNumber = null, status = "" }) {
  const { rows } = await db.query(
    `INSERT INTO notifications (id, user_id, commande_id, tracking_number, title, message, status)
     VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    [uuidv4(), userId, commandeId, trackingNumber, title, message, status]
  );
  pushToUser(userId, rows[0]);
}

/** Notification personnelle pour chaque destinataire d'un changement de statut (hors auteur du changement). */
async function notifyStatusChange(db, { recipients, actorId, commandeId, trackingNumber, title, message, status }) {
  const targets = [...new Set(recipients.filter(Boolean))].filter((id) => id !== actorId);
  for (const userId of targets) {
    await insertNotification(db, { userId, title, message, commandeId, trackingNumber, status });
  }
}

/** Notification personnelle à un seul utilisateur (ex: commission payée, compte suspendu). */
async function notifyUser(db, userId, { title, message, commandeId = null }) {
  await insertNotification(db, { userId, title, message, commandeId });
}

/** Notification à tout un rôle (ex: tous les admins, tous les agents), en excluant éventuellement l'auteur de l'action. */
async function notifyRole(db, { role, title, message, excludeUserId, commandeId = null }) {
  const { rows } = await db.query("SELECT id FROM users WHERE role = ? AND status = 'active'", [role]);
  for (const { id } of rows) {
    if (id === excludeUserId) continue;
    await insertNotification(db, { userId: id, title, message, commandeId });
  }
}

module.exports = { notifyStatusChange, notifyUser, notifyRole };
