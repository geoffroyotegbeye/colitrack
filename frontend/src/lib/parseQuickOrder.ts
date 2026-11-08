// Extraction d'une commande à partir d'un texte collé (format WhatsApp ou libre)
// Format de référence (CDC) :
//   CLIENT :
//   Nom :
//   Téléphone :
//   Adresse :
//   COMMANDE :
//   Produit :
//   Prix :
//   Quantité :

export interface QuickOrderParsed {
  client_name: string;
  client_phone: string;
  address: string;
  product: string;
  price: string;
  quantity: string;
  notes: string;
}

export interface QuickOrderField {
  key: keyof QuickOrderParsed;
  label: string;
  required: boolean;
}

export const QUICK_ORDER_FIELDS: QuickOrderField[] = [
  { key: "client_name", label: "Nom du client", required: true },
  { key: "client_phone", label: "Téléphone", required: true },
  { key: "address", label: "Adresse / Ville", required: true },
  { key: "product", label: "Produit", required: true },
  { key: "price", label: "Prix", required: true },
  { key: "quantity", label: "Quantité", required: false },
  { key: "notes", label: "Notes", required: false },
];

const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

const FIELD_ALIASES: Record<keyof QuickOrderParsed, string[]> = {
  client_name: ["nom", "nom client", "client", "nom du client"],
  client_phone: ["telephone", "tel", "numero", "num", "contact", "whatsapp", "numero de telephone"],
  address: ["adresse", "adresse client", "ville", "localisation", "lieu"],
  product: ["produit", "article", "nom produit", "produits"],
  price: ["prix", "montant", "prix unitaire", "cout", "prix total"],
  quantity: ["quantite", "qte", "qty", "nombre"],
  notes: ["notes", "remarque", "remarques", "observation", "observations", "info", "informations"],
};

function matchLabel(rawLabel: string): keyof QuickOrderParsed | null {
  const normalized = stripAccents(rawLabel.trim().toLowerCase()).replace(/[^a-z0-9\s]/g, "");
  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [keyof QuickOrderParsed, string[]][]) {
    if (aliases.includes(normalized)) return field;
  }
  return null;
}

/** Parse un texte collé (format "Label : valeur" par ligne) en champs de commande. */
export function parseQuickOrder(text: string): QuickOrderParsed {
  const result: QuickOrderParsed = {
    client_name: "", client_phone: "", address: "",
    product: "", price: "", quantity: "", notes: "",
  };

  const lines = text.split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*([^:]{1,40}):\s*(.*)$/);
    if (!match) continue;
    const [, rawLabel, rawValue] = match;
    const field = matchLabel(rawLabel);
    const value = rawValue.trim();
    if (!field || !value) continue;

    if (field === "price") {
      result.price = value.replace(/[^\d.,]/g, "").replace(",", ".");
    } else if (field === "quantity") {
      const digits = value.match(/\d+/);
      result.quantity = digits ? digits[0] : value;
    } else if (field === "client_phone") {
      result.client_phone = value.replace(/[^\d+\s]/g, "").trim();
    } else {
      result[field] = value;
    }
  }

  return result;
}

export function isQuickOrderComplete(parsed: QuickOrderParsed): boolean {
  return QUICK_ORDER_FIELDS.filter((f) => f.required).every((f) => parsed[f.key].trim() !== "");
}
