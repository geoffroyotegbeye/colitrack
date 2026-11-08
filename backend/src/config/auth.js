const jwt = require("jsonwebtoken");
const db = require("./db");

function bearerToken(req) {
  const header = req.headers.authorization;
  return header && header.startsWith("Bearer ") ? header.split(" ")[1] : null;
}

/**
 * Vérifie le jeton PUIS relit le compte en base : un compte suspendu ou supprimé est coupé
 * immédiatement (sans attendre l'expiration du jeton), et un changement de rôle s'applique
 * tout de suite. Renvoie null si le jeton est invalide ou le compte inutilisable.
 */
async function resolveUser(token) {
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return { error: "Token invalide ou expiré" };
  }
  const { rows } = await db.query("SELECT id, email, role, status FROM users WHERE id = ?", [payload.id]);
  if (!rows.length) return { error: "Compte introuvable" };
  if (rows[0].status === "suspended") return { error: "Compte suspendu — contactez l'administrateur" };
  const { id, email, role } = rows[0];
  return { user: { id, email, role } };
}

async function authMiddleware(req, res, next) {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: "Token manquant" });
  try {
    const { user, error } = await resolveUser(token);
    if (error) return res.status(401).json({ error });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Accès réservé aux admins" });
  }
  next();
}

// Décode le token s'il est présent, mais n'exige pas d'être connecté
// (ex: commande passée depuis la marketplace publique par un visiteur anonyme)
async function optionalAuth(req, res, next) {
  const token = bearerToken(req);
  req.user = null;
  if (!token) return next();
  try {
    const { user } = await resolveUser(token);
    req.user = user || null;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authMiddleware, adminOnly, optionalAuth, resolveUser };
