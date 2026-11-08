import { useState, useEffect } from "react";
import { FullTrackingTimeline } from "@/components/FullTrackingTimeline";
import { StatusBadge } from "@/components/StatusBadge";
import type { OrderStatus } from "@/lib/types";
import { DELIVERY_MODES, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, COLIS_STATUS_LABELS, COLIS_STATUS_COLORS, type ColisStatus } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Search, MapPin, Truck, ShieldCheck, Clock, Globe, ChevronRight, CalendarClock, DollarSign, Weight, Mail, CheckCircle2, Zap, Plane, Ship, Headphones, Store } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type TrackingRow } from "@/lib/api";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { TestimonialCarousel } from "@/components/TestimonialCarousel";

const COVERED_COUNTRIES = [
  { name: "Bénin", flag: "🇧🇯" }, { name: "Togo", flag: "🇹🇬" }, { name: "Ghana", flag: "🇬🇭" },
  { name: "Nigeria", flag: "🇳🇬" }, { name: "Sénégal", flag: "🇸🇳" }, { name: "Côte d'Ivoire", flag: "🇨🇮" },
  { name: "Mali", flag: "🇲🇱" }, { name: "Burkina Faso", flag: "🇧🇫" }, { name: "Guinée", flag: "🇬🇳" },
  { name: "Niger", flag: "🇳🇪" }, { name: "Kenya", flag: "🇰🇪" }, { name: "Tanzanie", flag: "🇹🇿" },
  { name: "Ouganda", flag: "🇺🇬" }, { name: "Rwanda", flag: "🇷🇼" }, { name: "Éthiopie", flag: "🇪🇹" },
  { name: "RD Congo", flag: "🇨🇩" }, { name: "Cameroun", flag: "🇨🇲" }, { name: "Gabon", flag: "🇬🇦" },
];

const DELIVERY_INFO: Record<string, { icon: typeof Truck; delay: [number, number]; desc: string }> = {
  express: { icon: Zap, delay: [3, 7], desc: "Le plus rapide pour vos colis urgents." },
  aerien: { icon: Plane, delay: [5, 14], desc: "Rapide et fiable pour vos colis de taille moyenne." },
  standard: { icon: Truck, delay: [14, 20], desc: "Le bon compromis entre délai et prix." },
  maritime: { icon: Ship, delay: [35, 50], desc: "Le plus économique pour les gros volumes." },
};

const TrackingPage = () => {
  const [searchParams] = useSearchParams();
  const [trackingInput, setTrackingInput] = useState(searchParams.get("number") || "");
  const [results, setResults] = useState<TrackingRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const runSearch = async (number: string) => {
    if (!number.trim()) return;
    setLoading(true);
    try {
      const data = await api.tracking.public(number.trim());
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearched(true);
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(trackingInput);
    scrollToSearch();
  };

  useEffect(() => {
    const fromUrl = searchParams.get("number");
    if (fromUrl) runSearch(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const order = results.length > 0 ? results[0] : null;
  const events = results.filter((r) => r.event_status).map((r, i) => ({
    id: `evt-${i}`, orderId: "",
    status: r.event_status as OrderStatus,
    description: r.event_description || "",
    timestamp: r.event_date || "",
  }));

  const scrollToSearch = () => document.getElementById("search-section")?.scrollIntoView({ behavior: "smooth" });

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !subscribeEmail.trim()) return;
    setSubscribing(true);
    try {
      await api.tracking.subscribe(order.tracking_number, subscribeEmail.trim());
      setSubscribed(true);
      toast.success("Vous serez notifié par email des mises à jour");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-primary-foreground/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/tracking" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <Package className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <span className="text-lg font-bold font-heading text-primary-foreground">ColiTrack</span>
              <p className="text-[10px] text-primary-foreground/50 -mt-1">Import Chine → Afrique</p>
            </div>
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <Link to="/marketplace">
              <Button variant="ghost" size="sm" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
                <Store className="h-4 w-4 mr-1.5" />Marketplace
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={scrollToSearch} className="hidden sm:inline-flex text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <Search className="h-4 w-4 mr-1.5" />Suivre
            </Button>
            <Link to="/login">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">Connexion</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6">
                <Globe className="h-3.5 w-3.5" /> Livraison vers toute l'Afrique 🌍
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold font-heading text-primary-foreground leading-tight mb-6">
                Suivez vos <span className="text-accent">colis</span> en temps réel
              </h1>
              <p className="text-lg text-primary-foreground/60 mb-6 max-w-md">
                Entrez votre numéro de suivi et consultez l'état de votre importation à chaque étape.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-8 max-w-md" title={`${COVERED_COUNTRIES.length} pays desservis`}>
                {COVERED_COUNTRIES.map((c) => (
                  <span key={c.name} title={c.name} className="text-xl leading-none">{c.flag}</span>
                ))}
              </div>
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/40" />
                  <Input
                    value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} placeholder="N° de suivi..."
                    className="pl-11 h-12 bg-primary-foreground/10 border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40 focus-visible:ring-accent"
                  />
                </div>
                <Button type="submit" disabled={loading} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shrink-0">
                  {loading ? <div className="animate-spin h-4 w-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full" /> : <><Search className="h-4 w-4 mr-2" />Suivre mon colis</>}
                </Button>
              </form>
              <Link to="/login" className="inline-flex items-center gap-1 mt-4 text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                Espace client <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { icon: Truck, label: "Colis livrés", value: "10K+", color: "bg-accent/20 text-accent" },
                { icon: Globe, label: "Pays couverts", value: "18+", color: "bg-info/20 text-info" },
                { icon: ShieldCheck, label: "Suivi sécurisé", value: "100%", color: "bg-success/20 text-success" },
                { icon: Clock, label: "Délai moyen", value: "15j", color: "bg-warning/20 text-warning" },
              ].map((s) => (
                <div key={s.label} className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-2xl p-5">
                  <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ${s.color} mb-3`}><s.icon className="h-5 w-5" /></div>
                  <p className="text-2xl font-bold text-primary-foreground font-heading">{s.value}</p>
                  <p className="text-sm text-primary-foreground/50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative -mb-1">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L48 74.7C96 69 192 59 288 48C384 37 480 27 576 32C672 37 768 59 864 64C960 69 1056 59 1152 48C1248 37 1344 27 1392 21.3L1440 16V80H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: ShieldCheck, label: "Paiement sécurisé" },
            { icon: Clock, label: "Suivi en temps réel" },
            { icon: Globe, label: `${COVERED_COUNTRIES.length} pays desservis` },
            { icon: Headphones, label: "Support réactif" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2.5 justify-center sm:justify-start">
              <f.icon className="h-4 w-4 text-accent shrink-0" />
              <span className="text-sm font-medium text-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      <section id="search-section" className="py-16 lg:py-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold font-heading text-foreground mb-2">Rechercher un colis</h2>
            <p className="text-muted-foreground">Saisissez votre numéro de suivi</p>
          </div>
          <form onSubmit={handleSearch}>
            <div className="flex gap-3 p-2 bg-card rounded-2xl border border-border shadow-lg">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} placeholder="Ex: DHH-2026-K7M3QX9P"
                  className="pl-12 h-14 bg-transparent border-0 text-lg focus-visible:ring-0 focus-visible:ring-offset-0" />
              </div>
              <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground h-14 px-8 rounded-xl hover:bg-accent/90 font-semibold">
                {loading ? <div className="animate-spin h-5 w-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full" /> : <><Search className="h-4 w-4 mr-2" />Rechercher</>}
              </Button>
            </div>
          </form>

          <div className="mt-8">
            {searched && !order && (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground">Aucun colis trouvé</p>
                <p className="text-sm text-muted-foreground mt-1">Vérifiez votre numéro de suivi</p>
              </div>
            )}
            {order && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="bg-primary px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-primary-foreground/60">Numéro de suivi</p>
                      <p className="text-xl font-bold font-heading text-primary-foreground">{order.tracking_number}</p>
                    </div>
                    <StatusBadge label={ORDER_STATUS_LABELS[order.status as OrderStatus]} colorClass={ORDER_STATUS_COLORS[order.status as OrderStatus]} />
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {order.address_from && (
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted shrink-0"><MapPin className="h-4 w-4 text-muted-foreground" /></div>
                          <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Origine</p><p className="text-sm font-semibold text-foreground">{order.address_from}</p></div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-accent/10 shrink-0"><MapPin className="h-4 w-4 text-accent" /></div>
                        <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Destination</p><p className="text-sm font-semibold text-foreground">{order.address_to ? `${order.address_to} — ${order.city}` : order.city}</p></div>
                      </div>
                    </div>
                    <div className={`grid grid-cols-1 ${order.price !== undefined ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3 mt-5`}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-info/10 border border-info/20">
                        <CalendarClock className="h-5 w-5 text-info shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider">Arrivée estimée</p>
                          <p className="text-sm font-bold text-foreground">
                            {order.status === "delivered" ? "Livré ✓" : order.estimated_arrival
                              ? format(new Date(order.estimated_arrival), "dd MMMM yyyy", { locale: fr })
                              : (() => {
                                const [minD, maxD] = DELIVERY_INFO[order.delivery_mode]?.delay || [14, 20];
                                const base = new Date(order.order_created_at);
                                return `${format(addDays(base, minD), "dd MMM", { locale: fr })} — ${format(addDays(base, maxD), "dd MMM yyyy", { locale: fr })}`;
                              })()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Mode : {DELIVERY_MODES[order.delivery_mode] || order.delivery_mode}</p>
                        </div>
                      </div>
                      {order.price !== undefined && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-warning/10 border border-warning/20">
                          <DollarSign className="h-5 w-5 text-warning shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider">Frais</p>
                            <p className="text-sm font-bold text-foreground">{order.price > 0 ? `${Number(order.price).toLocaleString("fr-FR")} FCFA` : "À calculer"}</p>
                            <p className="text-[10px] text-muted-foreground">Taxe : {order.tax && order.tax > 0 ? `${Number(order.tax).toLocaleString("fr-FR")} FCFA` : "—"}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20">
                        <Weight className="h-5 w-5 text-accent shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider">Poids</p>
                          <p className="text-sm font-bold text-foreground">{order.weight > 0 ? `${order.weight} kg` : "—"}</p>
                        </div>
                      </div>
                    </div>
                    {order.client_name && (
                      <div className="flex items-center pt-4 mt-4 border-t border-border">
                        <span className="text-sm text-muted-foreground"><span className="font-medium">Client :</span> {order.client_name}</span>
                      </div>
                    )}
                    {order.colis_status && (
                      <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t border-border">
                        <span className="text-sm text-muted-foreground font-medium">Colis :</span>
                        <StatusBadge
                          label={COLIS_STATUS_LABELS[order.colis_status as ColisStatus] || order.colis_status}
                          colorClass={COLIS_STATUS_COLORS[order.colis_status as ColisStatus] || ""}
                        />
                        {order.colis_carrier && <span className="text-sm text-muted-foreground">Transporteur : {order.colis_carrier}</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                  <h3 className="font-heading font-semibold text-foreground mb-5 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />Progression du colis
                  </h3>
                  <FullTrackingTimeline currentStatus={order.status as OrderStatus} events={events} />
                </div>

                {order.status !== "delivered" && (
                  <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                    {subscribed ? (
                      <div className="flex items-center gap-3 text-success">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-medium">Vous serez notifié par email à chaque mise à jour de ce colis.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="email" value={subscribeEmail} onChange={(e) => setSubscribeEmail(e.target.value)}
                            placeholder="Votre email pour être notifié des mises à jour" required className="pl-10 h-11" />
                        </div>
                        <Button type="submit" disabled={subscribing} className="h-11 shrink-0">
                          {subscribing ? "..." : "M'avertir par email"}
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {!searched && (
        <section className="py-16 bg-muted/50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold font-heading text-foreground text-center mb-12">Comment ça marche ?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "01", icon: Package, title: "Passez commande", desc: "Commandez via votre agent ou directement sur notre plateforme." },
                { step: "02", icon: Globe, title: "Suivi en temps réel", desc: "Suivez votre colis à chaque étape : achat, expédition, transit." },
                { step: "03", icon: Truck, title: "Livraison en Afrique", desc: "Recevez votre colis dans votre pays." },
              ].map((item) => (
                <div key={item.step} className="relative bg-card rounded-2xl border border-border p-6 text-center">
                  <span className="absolute -top-4 left-6 text-5xl font-black font-heading text-accent/10">{item.step}</span>
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-accent/10 text-accent mb-4"><item.icon className="h-7 w-7" /></div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!searched && (
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold font-heading text-foreground text-center mb-2">Nos modes de livraison</h2>
            <p className="text-muted-foreground text-center mb-12">Choisissez le mode adapté à votre budget et vos délais</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(DELIVERY_INFO).map(([key, info]) => (
                <div key={key} className="bg-card rounded-2xl border border-border p-5">
                  <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-accent/10 text-accent mb-4"><info.icon className="h-5 w-5" /></div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">{DELIVERY_MODES[key] || key}</h3>
                  <p className="text-sm font-medium text-accent mb-2">{info.delay[0]}–{info.delay[1]} jours</p>
                  <p className="text-sm text-muted-foreground">{info.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!searched && (
        <section className="py-16 bg-muted/50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold font-heading text-foreground text-center mb-2">Ce que disent nos clients</h2>
            <p className="text-muted-foreground text-center mb-10">Des avis d'exemple — les vrais retours arrivent bientôt</p>
            <TestimonialCarousel />
          </div>
        </section>
      )}

      {!searched && (
        <section className="border-y border-border bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 py-16 grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">Programme partenaires</p>
              <h2 className="text-2xl lg:text-3xl font-bold font-heading text-foreground mb-4">
                Devenez agent ColiTrack
              </h2>
              <p className="text-muted-foreground max-w-md mb-7">
                Choisissez un produit dans notre marketplace, générez votre lien et partagez-le. Vous gagnez une commission sur chaque commande livrée. Zéro stock, zéro risque.
              </p>
              <Link to="/marketplace">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  Devenir agent <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="lg:col-span-2 divide-y divide-border">
              {[
                { icon: Store, title: "Lien d'affiliation", desc: "Un lien unique à partager pour chaque produit" },
                { icon: DollarSign, title: "Commission par vente", desc: "Créditée automatiquement une fois la commande livrée" },
                { icon: Globe, title: "Marketplace ColiTrack", desc: "Accès à tout le catalogue de produits" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3.5 py-4 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border text-accent shrink-0">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent"><Package className="h-4 w-4 text-accent-foreground" /></div>
            <span className="font-bold font-heading">ColiTrack</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-primary-foreground/60">
            <Link to="/process" className="hover:text-primary-foreground transition-colors">Processus</Link>
            <Link to="/terms" className="hover:text-primary-foreground transition-colors">Conditions</Link>
            <Link to="/login" className="hover:text-primary-foreground transition-colors">Connexion</Link>
          </div>
          <p className="text-xs text-primary-foreground/40">© {new Date().getFullYear()} ColiTrack</p>
        </div>
      </footer>
    </div>
  );
};

export default TrackingPage;
