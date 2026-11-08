import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export function ImportOrdersDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return { rows: [], errs: ["Fichier vide ou invalide"] };
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim().toLowerCase());
    const rows: any[] = [];
    const errs: string[] = [];
    lines.slice(1).forEach((line, i) => {
      const vals = line.split(",").map((v) => v.replace(/"/g, "").trim());
      const row: any = {};
      headers.forEach((h, j) => { row[h] = vals[j] || ""; });
      if (!row["client"] && !row["client_name"]) { errs.push(`Ligne ${i + 2} : nom client manquant`); return; }
      if (!row["téléphone"] && !row["client_phone"]) { errs.push(`Ligne ${i + 2} : téléphone manquant`); return; }
      rows.push({
        client_name: row["client"] || row["client_name"],
        client_phone: row["téléphone"] || row["client_phone"],
        city: row["ville"] || row["city"] || "",
        product: row["produit"] || row["product"] || "",
        quantity: parseInt(row["quantité"] || row["quantity"]) || 1,
        price: parseFloat(row["prix"] || row["price"]) || 0,
        weight: parseFloat(row["poids"] || row["weight"]) || 0,
        delivery_mode: row["mode"] || row["delivery_mode"] || "standard",
        address_from: "Import Chine",
        address_to: row["ville"] || row["city"] || "",
        package_type: "medium",
      });
    });
    return { rows, errs };
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows, errs } = parseCSV(ev.target?.result as string);
      setPreview(rows);
      setErrors(errs);
    };
    reader.readAsText(file, "utf-8");
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      for (const row of preview) {
        await api.commandes.create(row);
      }
    },
    onSuccess: () => {
      toast.success(`${preview.length} commande(s) importée(s) !`);
      queryClient.invalidateQueries({ queryKey: ["commandes"] });
      queryClient.invalidateQueries({ queryKey: ["commandes-page"] });
      setPreview([]);
      setErrors([]);
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Importer des commandes CSV</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-accent/50 transition-colors" onClick={() => fileRef.current?.click()}>
            <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cliquez pour sélectionner un fichier CSV</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Colonnes : client, téléphone, ville, produit, quantité, prix</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>

          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" /> {e}
                </div>
              ))}
            </div>
          )}

          {preview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" /> {preview.length} commande(s) prête(s) à importer
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {preview.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1">
                    <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="font-medium">{r.client_name}</span>
                    <span className="text-muted-foreground">— {r.product || "—"} — {r.city}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending} className="w-full gradient-accent text-accent-foreground hover:opacity-90">
                {importMutation.isPending ? "Import en cours..." : `Importer ${preview.length} commande(s)`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
