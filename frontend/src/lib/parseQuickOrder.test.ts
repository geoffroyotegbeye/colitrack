import { describe, it, expect } from "vitest";
import { parseQuickOrder, isQuickOrderComplete } from "./parseQuickOrder";

describe("parseQuickOrder", () => {
  it("extracts fields from the CDC reference format", () => {
    const text = `CLIENT :
Nom : Amadou Sow
Téléphone : +229 97 20 21 01
Adresse : Cotonou

COMMANDE :
Produit : Chaussures Nike Air Max
Prix : 25000
Quantité : 2`;

    const parsed = parseQuickOrder(text);
    expect(parsed.client_name).toBe("Amadou Sow");
    expect(parsed.client_phone).toBe("+229 97 20 21 01");
    expect(parsed.address).toBe("Cotonou");
    expect(parsed.product).toBe("Chaussures Nike Air Max");
    expect(parsed.price).toBe("25000");
    expect(parsed.quantity).toBe("2");
    expect(isQuickOrderComplete(parsed)).toBe(true);
  });

  it("normalizes price with currency and thousand separators", () => {
    const parsed = parseQuickOrder("Prix : 25 000 FCFA");
    expect(parsed.price).toBe("25000");
  });

  it("tolerates alternate label wording and accents", () => {
    const text = `Client : Fatou\nTel : 0197202101\nVille : Porto-Novo\nArticle : Sac\nMontant : 15000`;
    const parsed = parseQuickOrder(text);
    expect(parsed.client_name).toBe("Fatou");
    expect(parsed.client_phone).toBe("0197202101");
    expect(parsed.address).toBe("Porto-Novo");
    expect(parsed.product).toBe("Sac");
    expect(parsed.price).toBe("15000");
  });

  it("flags incomplete extraction as not complete", () => {
    const parsed = parseQuickOrder("Nom : Jean");
    expect(isQuickOrderComplete(parsed)).toBe(false);
  });

  it("ignores unrelated or malformed lines", () => {
    const parsed = parseQuickOrder("Bonjour, voici ma commande\nNom : Jean\n---\nPrix :");
    expect(parsed.client_name).toBe("Jean");
    expect(parsed.price).toBe("");
  });
});
