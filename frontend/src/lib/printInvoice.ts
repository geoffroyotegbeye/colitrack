import type { Commande } from "@/lib/api";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/** Ouvre une fenêtre imprimable pour la facture d'une commande (impression ou "Enregistrer en PDF"). */
export function printInvoice(order: Commande, agentName?: string | null) {
  const total = Number(order.price) + Number(order.tax || 0);
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;

  const row = (label: string, value: string | number) => `
    <tr>
      <td style="padding:6px 0;color:#666;">${label}</td>
      <td style="padding:6px 0;text-align:right;font-weight:600;">${value}</td>
    </tr>`;

  win.document.write(`
    <!doctype html>
    <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>Facture ${order.tracking_number}</title>
      <style>
        body { font-family: -apple-system, Arial, sans-serif; color: #1a1a1a; padding: 40px; max-width: 640px; margin: 0 auto; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .muted { color: #666; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        .section-title { font-size: 13px; text-transform: uppercase; letter-spacing: .05em; color: #666; margin-top: 28px; margin-bottom: 8px; }
        .total-row td { border-top: 2px solid #1a1a1a; padding-top: 12px; font-size: 18px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>Facture — ColicTrack</h1>
      <p class="muted">N° de suivi : <strong>${order.tracking_number}</strong> · ${format(new Date(order.created_at), "dd MMMM yyyy", { locale: fr })}</p>

      <div class="section-title">Client</div>
      <table>
        ${row("Nom", order.client_name)}
        ${row("Téléphone", order.client_phone)}
        ${row("Adresse de livraison", order.address_to)}
      </table>

      <div class="section-title">Détails</div>
      <table>
        ${row("Produit", order.product || "-")}
        ${row("Quantité", order.quantity)}
        ${row("Prix unitaire", `${Number(order.price).toLocaleString()} FCFA`)}
        ${row("Taxe", `${Number(order.tax || 0).toLocaleString()} FCFA`)}
        ${agentName ? row("Agent", agentName) : ""}
        ${row("Statut", ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status)}
      </table>

      <table>
        <tr class="total-row">
          <td>Total</td>
          <td style="text-align:right;">${total.toLocaleString()} FCFA</td>
        </tr>
      </table>
    </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
