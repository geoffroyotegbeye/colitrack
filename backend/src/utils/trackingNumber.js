const crypto = require("crypto");

// Sans 0/O, 1/I/L : lisible et dictable au téléphone sans confusion.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const LENGTH = 8; // 31^8 ≈ 8,5 × 10^11 combinaisons : impossible à énumérer

/**
 * Numéro de suivi non devinable (ex. DHH-2026-K7M3QX9P). Remplace l'ancien compteur séquentiel
 * (DHH-2026-000145), qui permettait de parcourir toutes les commandes et pouvait produire des
 * doublons quand deux commandes étaient créées en même temps.
 */
function generateTrackingNumber() {
  let code = "";
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return `DHH-${new Date().getFullYear()}-${code}`;
}

module.exports = { generateTrackingNumber };
