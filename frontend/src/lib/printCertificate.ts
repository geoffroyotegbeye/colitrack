import { format } from "date-fns";
import { fr } from "date-fns/locale";

/** Ouvre une fenêtre imprimable pour le certificat d'un cours terminé (impression ou "Enregistrer en PDF"). */
export function printCertificate(courseTitle: string, fullName: string, issuedAt: string = new Date().toISOString()) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;

  win.document.write(`
    <!doctype html>
    <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>Certificat — ${courseTitle}</title>
      <style>
        body { font-family: -apple-system, Arial, sans-serif; color: #1a1a1a; padding: 0; margin: 0; }
        .cert { max-width: 800px; margin: 40px auto; padding: 60px; border: 8px solid #1a1a1a; text-align: center; }
        .brand { font-size: 14px; text-transform: uppercase; letter-spacing: .15em; color: #666; }
        h1 { font-size: 32px; margin: 24px 0 8px; }
        .sub { color: #666; font-size: 15px; margin-bottom: 32px; }
        .name { font-size: 28px; font-weight: bold; margin: 24px 0; border-bottom: 2px solid #1a1a1a; display: inline-block; padding-bottom: 8px; }
        .course { font-size: 20px; font-style: italic; margin: 16px 0 32px; }
        .date { color: #666; font-size: 13px; margin-top: 40px; }
        @media print { .cert { border-width: 6px; margin: 0; } }
      </style>
    </head>
    <body>
      <div class="cert">
        <div class="brand">ColiTrack — Centre de formation</div>
        <h1>Certificat de réussite</h1>
        <p class="sub">Ce certificat est décerné à</p>
        <div class="name">${fullName}</div>
        <p class="sub">pour avoir complété avec succès le cours</p>
        <div class="course">"${courseTitle}"</div>
        <p class="date">Délivré le ${format(new Date(issuedAt), "dd MMMM yyyy", { locale: fr })}</p>
      </div>
    </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
