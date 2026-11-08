import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PACKAGE_TYPE_LABELS, DELIVERY_MODES } from "@/lib/types";
import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save, PenLine, ClipboardPaste, Boxes } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { QuickOrderPaste } from "@/components/QuickOrderPaste";
import { cn } from "@/lib/utils";

const emptyPick = { product: "", quantity: "1", price: "", productLink: "", weight: "" };

const NewOrderPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isAgent } = useAuth();
  const [mode, setMode] = useState<"manual" | "paste">("paste");
  const [loading, setLoading] = useState(false);
  const [packageType, setPackageType] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("standard");
  const [pick, setPick] = useState(emptyPick);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const { data: catalog = [] } = useQuery({
    queryKey: ["produits"],
    queryFn: () => api.produits.list(),
    enabled: mode === "manual",
  });

  const { data: taxSetting } = useQuery({
    queryKey: ["tax-rate"],
    queryFn: () => api.taxes.getRate(),
    enabled: mode === "manual",
  });
  const taxRate = taxSetting?.rate ?? 0;
  const estimatedTax = Math.round((parseFloat(pick.price) || 0) * (taxRate / 100));

  const selectedProduct = catalog.find((c) => c.id === selectedProductId);
  const productTransportModes = selectedProduct?.transport_options.map((o) => o.mode) || [];

  const applyProduct = (id: string) => {
    const p = catalog.find((c) => c.id === id);
    if (!p) return;
    setSelectedProductId(id);
    setPick({
      product: p.name,
      quantity: String(p.default_quantity || 1),
      price: String(p.default_price || ""),
      productLink: p.product_link || "",
      weight: String(p.weight || ""),
    });
    if (p.transport_options.length > 0) setDeliveryMode(p.transport_options[0].mode);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value;
    try {
      const order = await api.commandes.create({
        client_name: get("clientName"),
        client_phone: get("clientPhone"),
        city: get("city"),
        address_from: "Import Chine",
        address_to: get("city"),
        product: get("product"),
        quantity: parseInt(get("quantity")) || 1,
        product_link: get("productLink") || undefined,
        package_type: packageType,
        weight: parseFloat(get("weight")) || 0,
        price: parseFloat(get("price")) || 0,
        delivery_mode: deliveryMode,
        agent_id: user?.id,
      });
      toast.success(`Commande créée ! N° : ${order.tracking_number}`);
      navigate("/orders");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin && !isAgent) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/orders" className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">Nouvelle commande</h1>
            <p className="text-muted-foreground mt-1">Enregistrer une commande d'importation</p>
          </div>
        </div>

        <div className="inline-flex rounded-xl border border-border bg-card p-1 gap-1">
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              mode === "paste" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ClipboardPaste className="h-4 w-4" /> Coller un message
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              mode === "manual" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <PenLine className="h-4 w-4" /> Saisie manuelle
          </button>
        </div>

        {mode === "paste" && (
          <QuickOrderPaste onCreated={(order) => navigate(`/orders/${order.id}`)} />
        )}

        {mode === "manual" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
              <h2 className="font-heading font-semibold text-foreground">Informations client</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nom du client</Label>
                  <Input id="clientName" name="clientName" placeholder="Ex: Amadou Sow" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Téléphone</Label>
                  <PhoneInput id="clientPhone" name="clientPhone" placeholder="+229 XX XXX XXX" required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input id="city" name="city" placeholder="Ex: Cotonou, Porto-Novo" required />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
              <h2 className="font-heading font-semibold text-foreground">Expédition</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de colis</Label>
                  <Select required value={packageType} onValueChange={setPackageType}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PACKAGE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mode de livraison</Label>
                  <Select value={deliveryMode} onValueChange={setDeliveryMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(productTransportModes.length > 0 ? productTransportModes : Object.keys(DELIVERY_MODES)).map((mode) => (
                        <SelectItem key={mode} value={mode}>{DELIVERY_MODES[mode] || mode}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Poids (kg)</Label>
                  <Input id="weight" name="weight" type="number" min="0" step="0.1" placeholder="0.0" value={pick.weight} onChange={(e) => setPick((p) => ({ ...p, weight: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Taxe {taxRate > 0 && `(${taxRate}%, calculée automatiquement)`}</Label>
                  <Input readOnly disabled value={`${estimatedTax.toLocaleString()} FCFA`} className="bg-muted" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="font-heading font-semibold text-foreground">Détails du produit</h2>
              {catalog.length > 0 && (
                <Select onValueChange={applyProduct}>
                  <SelectTrigger className="w-56 h-9 text-xs gap-1.5">
                    <Boxes className="h-3.5 w-3.5 shrink-0" />
                    <SelectValue placeholder="Choisir depuis le catalogue" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalog.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                <Label htmlFor="product">Produit</Label>
                <Input id="product" name="product" placeholder="Ex: Chaussures Nike Air Max" value={pick.product} onChange={(e) => setPick((p) => ({ ...p, product: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité</Label>
                <Input id="quantity" name="quantity" type="number" min="1" placeholder="1" value={pick.quantity} onChange={(e) => setPick((p) => ({ ...p, quantity: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Prix (FCFA)</Label>
                <Input id="price" name="price" type="number" min="0" placeholder="0" value={pick.price} onChange={(e) => setPick((p) => ({ ...p, price: e.target.value }))} required />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                <Label htmlFor="productLink">Lien du produit (optionnel)</Label>
                <Input id="productLink" name="productLink" placeholder="https://shein.com/..." value={pick.productLink} onChange={(e) => setPick((p) => ({ ...p, productLink: e.target.value }))} />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading || !packageType} className="gradient-accent text-accent-foreground hover:opacity-90 w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Enregistrement..." : "Enregistrer la commande"}
          </Button>
        </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NewOrderPage;
