import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, saveToken, saveUser } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PACKAGE_TYPE_LABELS, DELIVERY_MODES } from "@/lib/types";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Package, CheckCircle, Send, User, Phone, MapPin, ShieldCheck, Truck, Clock, Link2, Copy, Check, ArrowLeft, ShoppingCart } from "lucide-react";

const emptyContact = { clientName: "", clientPhone: "", city: "" };

const ProductPage = () => {
  const { code, id } = useParams<{ code?: string; id?: string }>();
  const navigate = useNavigate();
  const { user, isAgent, signIn } = useAuth();
  const { count, addItem } = useCart();
  const [packageType, setPackageType] = useState("medium");
  const [deliveryMode, setDeliveryMode] = useState("standard");
  const [contact, setContact] = useState(emptyContact);
  const [loading, setLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isLoading, error } = useQuery({
    queryKey: code ? ["affiliate-product", code] : ["marketplace-product", id],
    queryFn: () => (code ? api.affiliate.resolve(code) : api.produits.getPublic(id!)),
    enabled: !!(code || id),
  });

  const { data: taxSetting } = useQuery({
    queryKey: ["tax-rate"],
    queryFn: () => api.taxes.getRate(),
  });

  const gallery = product ? [product.main_image_url, ...(product.images || [])].filter(Boolean) as string[] : [];
  const transportOptions = product?.transport_options || [];

  useEffect(() => {
    if (transportOptions.length && !transportOptions.some((o) => o.mode === deliveryMode)) {
      setDeliveryMode(transportOptions[0].mode);
    }
  }, [product]);

  const selectedTransport = transportOptions.find((o) => o.mode === deliveryMode);
  const taxAmount = product ? Math.round(product.default_price * ((taxSetting?.rate ?? 0) / 100)) : 0;
  const transportCost = selectedTransport ? Math.round((product?.weight || 0) * selectedTransport.rate_per_kg) : 0;
  const total = (product?.default_price || 0) + taxAmount + transportCost;
  const estimatedArrival = selectedTransport
    ? `${format(addDays(new Date(), selectedTransport.delay_min_days), "dd MMM", { locale: fr })} – ${format(addDays(new Date(), selectedTransport.delay_max_days), "dd MMM", { locale: fr })}`
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setLoading(true);
    try {
      const order = await api.commandes.create({
        client_name: contact.clientName,
        client_phone: contact.clientPhone,
        city: contact.city,
        address_from: "Import Chine",
        address_to: contact.city,
        product: product.name,
        quantity: 1,
        price: product.default_price,
        product_link: product.product_link || undefined,
        package_type: packageType,
        delivery_mode: deliveryMode,
        weight: product.weight || 0,
        affiliate_code: code,
        product_id: product.id,
      });
      setTrackingResult(order.tracking_number);
      toast.success("Commande créée avec succès !");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateLink = async () => {
    if (!user || !product) return;
    setGenerating(true);
    try {
      const { link, authRefresh } = await api.affiliate.generateLink(product.id);
      if (authRefresh) {
        saveToken(authRefresh.token);
        saveUser(authRefresh.user);
        signIn(authRefresh.user);
        toast.success("Vous êtes maintenant agent affilié !");
      }
      setGeneratedLink(`${window.location.origin}/p/${link.code}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const addToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id, name: product.name, price: product.default_price,
      image: product.main_image_url, weight: product.weight || 0,
      productLink: product.product_link, affiliateCode: code, deliveryMode,
    });
    toast.success(`"${product.name}" ajouté au panier`);
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/marketplace");
  };

  const copyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4 text-center">
        <Package className="h-12 w-12 text-muted-foreground/30" />
        <h1 className="text-xl font-bold text-foreground">Produit introuvable</h1>
        <p className="text-muted-foreground max-w-sm">{code ? "Ce lien n'est plus valide." : "Ce produit n'est plus disponible."}</p>
        <Link to="/marketplace" className="text-accent hover:underline text-sm">← Voir la marketplace</Link>
      </div>
    );
  }

  if (trackingResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center space-y-5 shadow-xl">
          <CheckCircle className="h-12 w-12 text-success mx-auto" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Commande confirmée !</h1>
            <p className="text-muted-foreground mt-2 text-sm">Votre commande a bien été enregistrée.</p>
          </div>
          <div className="bg-primary rounded-xl p-5 text-primary-foreground">
            <p className="text-xs opacity-70">Numéro de suivi</p>
            <p className="text-xl font-mono font-bold mt-1 tracking-wider">{trackingResult}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Suivez votre colis sur{" "}
            <Link to="/tracking" className="text-accent font-medium underline underline-offset-2">la page de suivi</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-primary border-b border-primary-foreground/10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors shrink-0" title="Retour">
              <ArrowLeft className="h-4 w-4 text-primary-foreground" />
            </button>
            <Link to="/tracking" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                <Package className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-lg font-bold font-heading text-primary-foreground">ColiTrack</span>
            </Link>
          </div>
          <Link to="/panier" className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors" title="Panier">
            <ShoppingCart className="h-4 w-4 text-primary-foreground" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="h-64 md:h-80 bg-muted rounded-2xl overflow-hidden flex items-center justify-center border border-border">
              {gallery.length > 0 ? (
                <img src={gallery[activeImage] ?? gallery[0]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-16 w-16 text-muted-foreground/30" />
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImage ? "border-accent" : "border-transparent"}`}
                  >
                    <img src={url} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-accent" />Paiement sécurisé</span>
              <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-accent" />Livraison rapide</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-accent" />Suivi en temps réel</span>
            </div>
            {!code && (
              <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-foreground">Vendez ce produit</p>
                  <p className="text-xs text-muted-foreground">Générez votre lien et gagnez une commission par vente</p>
                </div>
                {!user ? (
                  <Link to="/login"><Button size="sm" variant="outline" className="shrink-0">Se connecter pour vendre</Button></Link>
                ) : isAgent ? (
                  <Button size="sm" variant="outline" disabled={generating} onClick={generateLink} className="gap-1.5 shrink-0">
                    <Link2 className="h-3.5 w-3.5" />{generating ? "..." : "Générer mon lien"}
                  </Button>
                ) : (
                  <Link to="/digimarket"><Button size="sm" variant="outline" className="shrink-0">Devenir agent pour vendre</Button></Link>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              {product.category && <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{product.category}</p>}
              <h1 className="text-2xl font-bold font-heading text-foreground">{product.name}</h1>
              {product.description && <p className="text-muted-foreground mt-2 text-sm">{product.description}</p>}
              <p className="text-3xl font-bold text-accent mt-4">{product.default_price.toLocaleString()} F</p>
              <Button type="button" variant="outline" onClick={addToCart} className="w-full sm:w-auto gap-2 mt-4">
                <ShoppingCart className="h-4 w-4" />Ajouter au panier
              </Button>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Mode de transport</Label>
                <Select value={deliveryMode} onValueChange={setDeliveryMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(transportOptions.length > 0 ? transportOptions.map((o) => o.mode) : Object.keys(DELIVERY_MODES)).map((mode) => (
                      <SelectItem key={mode} value={mode}>{DELIVERY_MODES[mode] || mode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 text-sm border-t border-border pt-3">
                <div className="flex justify-between text-muted-foreground"><span>Prix produit</span><span className="text-foreground">{product.default_price.toLocaleString()} F</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Taxe</span><span className="text-foreground">{taxAmount.toLocaleString()} F</span></div>
                {selectedTransport && (
                  <div className="flex justify-between text-muted-foreground"><span>Transport ({DELIVERY_MODES[deliveryMode] || deliveryMode})</span><span className="text-foreground">{transportCost.toLocaleString()} F</span></div>
                )}
                <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1.5"><span>Total</span><span>{total.toLocaleString()} F</span></div>
              </div>
              {estimatedArrival && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5 text-accent" />Arrivée estimée : {estimatedArrival}</p>
              )}
              <p className="text-xs text-muted-foreground">Transport payable à la réception, une fois la commande récupérée.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
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
                <Send className="h-4 w-4" />{loading ? "Envoi..." : "Commander"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <Dialog open={!!generatedLink} onOpenChange={(o) => !o && setGeneratedLink(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Votre lien pour "{product.name}"</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Partagez ce lien. Chaque commande livrée passée depuis ce lien vous rapporte une commission, visible dans "Mes affiliations".
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 bg-muted/50 rounded-lg px-3 py-2 text-sm text-accent font-mono truncate">{generatedLink}</div>
              <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0 gap-2">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copié !" : "Copier"}
              </Button>
            </div>
            <Link to="/affiliation">
              <Button variant="ghost" className="w-full text-sm">Voir toutes mes affiliations →</Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductPage;
