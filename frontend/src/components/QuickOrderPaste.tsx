import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PACKAGE_TYPE_LABELS } from "@/lib/types";
import { parseQuickOrder, isQuickOrderComplete, QUICK_ORDER_FIELDS, type QuickOrderParsed } from "@/lib/parseQuickOrder";
import { api, type Commande } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ClipboardPaste, Wand2, RotateCcw, Save } from "lucide-react";

const EXAMPLE_TEXT = `CLIENT :
Nom : Amadou Sow
Téléphone : +229 97 20 21 01
Adresse : Cotonou

COMMANDE :
Produit : Chaussures Nike Air Max
Prix : 25000
Quantité : 1`;

const EMPTY: QuickOrderParsed = {
  client_name: "", client_phone: "", address: "", product: "", price: "", quantity: "1", notes: "",
};

interface QuickOrderPasteProps {
  onCreated: (order: Commande) => void;
}

export function QuickOrderPaste({ onCreated }: QuickOrderPasteProps) {
  const { user } = useAuth();
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<QuickOrderParsed | null>(null);
  const [packageType, setPackageType] = useState("medium");
  const [loading, setLoading] = useState(false);

  const analyze = () => {
    if (!rawText.trim()) return;
    setParsed(parseQuickOrder(rawText));
  };

  const reset = () => {
    setParsed(null);
    setRawText("");
  };

  const setField = (key: keyof QuickOrderParsed) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setParsed((p) => ({ ...(p ?? EMPTY), [key]: e.target.value }));

  const handleCreate = async () => {
    if (!parsed) return;
    setLoading(true);
    try {
      const order = await api.commandes.create({
        client_name: parsed.client_name,
        client_phone: parsed.client_phone,
        city: parsed.address,
        address_from: "Import Chine",
        address_to: parsed.address,
        product: parsed.product,
        quantity: parseInt(parsed.quantity) || 1,
        price: parseFloat(parsed.price) || 0,
        notes: parsed.notes || undefined,
        package_type: packageType,
        delivery_mode: "standard",
        agent_id: user?.id,
      });
      toast.success(`Commande créée ! N° : ${order.tracking_number}`);
      onCreated(order);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!parsed) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardPaste className="h-4 w-4 text-accent" />
          <h2 className="font-heading font-semibold text-foreground">Coller un message (WhatsApp ou autre)</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Collez le message du client, ColicTrack détecte automatiquement les informations. Format suggéré :
        </p>
        <pre className="text-xs bg-muted/50 rounded-lg p-3 text-muted-foreground whitespace-pre-wrap">{EXAMPLE_TEXT}</pre>
        <Textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Collez le message ici..."
          rows={10}
          className="font-mono text-sm"
        />
        <Button type="button" onClick={analyze} disabled={!rawText.trim()} className="gradient-accent text-accent-foreground hover:opacity-90">
          <Wand2 className="h-4 w-4 mr-2" />
          Analyser le message
        </Button>
      </div>
    );
  }

  const complete = isQuickOrderComplete(parsed);

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-foreground">Vérifiez les informations détectées</h2>
        <Button type="button" variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-muted-foreground">
          <RotateCcw className="h-3.5 w-3.5" /> Recommencer
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Corrigez si nécessaire avant de valider — rien n'est encore enregistré.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUICK_ORDER_FIELDS.map((f) => (
          <div key={f.key} className={`space-y-2 ${f.key === "notes" ? "sm:col-span-2" : ""}`}>
            <Label htmlFor={f.key} className={f.required && !parsed[f.key] ? "text-destructive" : ""}>
              {f.label}{f.required && !parsed[f.key] ? " (manquant)" : ""}
            </Label>
            <Input
              id={f.key}
              value={parsed[f.key]}
              onChange={setField(f.key)}
              className={f.required && !parsed[f.key] ? "border-destructive" : ""}
            />
          </div>
        ))}
        <div className="space-y-2">
          <Label>Type de colis</Label>
          <Select value={packageType} onValueChange={setPackageType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PACKAGE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleCreate}
        disabled={!complete || loading}
        className="gradient-accent text-accent-foreground hover:opacity-90 w-full sm:w-auto"
      >
        <Save className="h-4 w-4 mr-2" />
        {loading ? "Enregistrement..." : "Confirmer et créer la commande"}
      </Button>
    </div>
  );
}
