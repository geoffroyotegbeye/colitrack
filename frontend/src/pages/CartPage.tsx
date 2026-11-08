import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PACKAGE_TYPE_LABELS, DELIVERY_MODES } from "@/lib/types";
import { toast } from "sonner";
import {
  Package, ArrowLeft, Minus, Plus, Trash2, ShoppingCart, CheckCircle,
  Send, User, Phone, MapPin,
} from "lucide-react";

const emptyContact = { clientName: "", clientPhone: "", city: "" };

const CartPage = () => {
  const navigate = useNavigate();
  const { items, total, removeItem, setQuantity, clear } = useCart();
  const [packageType, setPackageType] = useState("medium");
  const [contact, setContact] = useState(emptyContact);
  const [loading, setLoading] = useState(false);
  const [trackingNumbers, setTrackingNumbers] = useState<string[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return;
    setLoading(true);
    try {
      const orders = await Promise.all(
        items.map((item) =>
          api.commandes.create({
            client_name: contact.clientName,
            client_phone: contact.clientPhone,
            city: contact.city,
            address_from: "Import Chine",
            address_to: contact.city,
            product: item.name,
            quantity: item.quantity,
            price: item.price * item.quantity,
            product_link: item.productLink || undefined,
            package_type: packageType,
            delivery_mode: item.deliveryMode,
            weight: item.weight * item.quantity,
            affiliate_code: item.affiliateCode,
            product_id: item.productId,
          })
        )
      );
      setTrackingNumbers(orders.map((o) => o.tracking_number));
      clear();
      toast.success("Commande(s) créée(s) avec succès !");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (trackingNumbers) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center space-y-5 shadow-xl">
          <CheckCircle className="h-12 w-12 text-success mx-auto" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Commande confirmée !</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {trackingNumbers.length > 1 ? "Vos commandes ont été enregistrées." : "Votre commande a bien été enregistrée."}
            </p>
          </div>
          <div className="space-y-2">
            {trackingNumbers.map((tn) => (
              <div key={tn} className="bg-primary rounded-xl p-4 text-primary-foreground">
                <p className="text-xl font-mono font-bold tracking-wider">{tn}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Suivez vos colis sur{" "}
            <Link to="/tracking" className="text-accent font-medium underline underline-offset-2">la page de suivi</Link>
          </p>
          <Link to="/marketplace"><Button variant="outline" className="w-full">Retour à la marketplace</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-primary border-b border-primary-foreground/10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors shrink-0" title="Retour">
            <ArrowLeft className="h-4 w-4 text-primary-foreground" />
          </button>
          <Link to="/tracking" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <Package className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-lg font-bold font-heading text-primary-foreground">ColiTrack</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold font-heading text-foreground mb-6 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />Mon panier
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Votre panier est vide</p>
            <Link to="/marketplace" className="text-accent hover:underline text-sm mt-2 inline-block">← Parcourir la marketplace</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
                  <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-muted-foreground/30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-sm font-bold text-accent">{item.price.toLocaleString()} F</p>
                    <p className="text-xs text-muted-foreground">{DELIVERY_MODES[item.deliveryMode] || item.deliveryMode}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQuantity(item.productId, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQuantity(item.productId, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeItem(item.productId)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">{total.toLocaleString()} F</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4 h-fit">
              <h2 className="font-semibold text-foreground text-sm">Vos informations</h2>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs"><User className="h-3.5 w-3.5" />Nom complet *</Label>
                <Input value={contact.clientName} onChange={(e) => setContact((c) => ({ ...c, clientName: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs"><Phone className="h-3.5 w-3.5" />Téléphone *</Label>
                <PhoneInput value={contact.clientPhone} onChange={(e) => setContact((c) => ({ ...c, clientPhone: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs"><MapPin className="h-3.5 w-3.5" />Ville de livraison *</Label>
                <Input value={contact.city} onChange={(e) => setContact((c) => ({ ...c, city: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Type de colis</Label>
                <Select value={packageType} onValueChange={setPackageType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(PACKAGE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <Send className="h-4 w-4" />{loading ? "Envoi..." : `Commander (${items.length} article${items.length > 1 ? "s" : ""})`}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
