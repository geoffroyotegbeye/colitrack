/**
 * Règles d'accès aux commandes, partagées par commandes.js, tracking.js et colis.js
 * pour qu'une même règle ne soit jamais appliquée différemment selon la route.
 */

/** Lecture : l'admin, l'agent responsable ou le client propriétaire. */
function canReadOrder(user, order) {
  if (!user || !order) return false;
  return user.role === "admin" || order.agent_id === user.id || order.client_id === user.id;
}

// Champs qui déterminent la commission d'affiliation (calculée sur le prix à la livraison) :
// sur une commande affiliée, l'agent qui touche la commission ne peut pas les modifier lui-même.
const AFFILIATE_LOCKED_FIELDS = ["price", "tax", "transport_cost", "weight", "quantity", "status"];

/**
 * Modification : renvoie un message d'erreur si `user` n'a pas le droit de modifier `fields`
 * sur `order`, ou null si c'est autorisé.
 */
function editRestriction(user, order, fields) {
  if (user.role === "admin") return null;
  if (user.role !== "agent" || order.agent_id !== user.id) return "Accès refusé";
  if (fields.includes("agent_id")) return "Seul un admin peut réattribuer une commande";
  if (order.affiliate_link_id) {
    const locked = fields.filter((f) => AFFILIATE_LOCKED_FIELDS.includes(f));
    if (locked.length) {
      return "Commande affiliée : seul un admin peut modifier le statut ou les montants";
    }
  }
  return null;
}

module.exports = { canReadOrder, editRestriction };
