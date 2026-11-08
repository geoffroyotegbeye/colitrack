import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { TrackingTimeline } from "@/components/TrackingTimeline";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, DELIVERY_MODES } from "@/lib/types";
import type { OrderStatus } from "@/lib/types";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, User, Package, Weight, DollarSign, ShoppingBag, ExternalLink, Truck, UserPlus, Pencil, Trash2, CalendarClock, Copy, Printer, Link2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState } from "react";
import { printInvoice } from "@/lib/printInvoice";

const ALL_STATUSES: OrderStatus[] = ["registered", "validated", "purchased", "in_china", "shipped", "in_transit", "arrived_benin", "delivering", "delivered", "refused"];

const OrderDetailPage = () => {
  const { id } = useParams();
  const { isAdmin, isAgent } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["commande", id],
    queryFn: () => api.commandes.get(id!),
    enabled: !!id,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["tracking", id],
    queryFn: () => api.tracking.history(id!),
    enabled: !!id,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["agents-list"],
    queryFn: () => api.agents.list(),
    enabled: isAdmin,
  });

  const { data: colisList = [] } = useQuery({
    queryKey: ["colis"],
    queryFn: () => api.colis.list(),
    enabled: isAdmin || isAgent,
  });
  const existingColis = colisList.find((c) => c.commande_id === id);

  const convertToColis = useMutation({
    mutationFn: () => api.colis.create({ commande_id: id! }),
    onSuccess: (colis) => {
      toast.success("Colis créé !");
      navigate(`/colis/${colis.id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      // Un seul appel : la route d'historique change le statut, l'enregistre et notifie
      const label = ORDER_STATUS_LABELS[status as OrderStatus] || status;
      const description = statusComment.trim() ? `${label} — ${statusComment.trim()}` : label;
      await api.tracking.addEvent(id!, status, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commande", id] });
      queryClient.invalidateQueries({ queryKey: ["tracking", id] });
      setStatusComment("");
      toast.success("Statut mis à jour !");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const duplicateOrder = async () => {
    if (!order) return;
    setDuplicating(true);
    try {
      const copy = await api.commandes.create({
        client_name: order.client_name,
        client_phone: order.client_phone,
        client_email: order.client_email || undefined,
        address_from: order.address_from,
        address_to: order.address_to,
        city: order.city,
        package_type: order.package_type,
        weight: order.weight,
        volume: order.volume,
        price: order.price,
        tax: order.tax,
        product: order.product,
        quantity: order.quantity,
        product_link: order.product_link || undefined,
        delivery_mode: order.delivery_mode,
        notes: order.notes || undefined,
        agent_id: order.agent_id || undefined,
      });
      toast.success(`Commande dupliquée ! N° : ${copy.tracking_number}`);
      navigate(`/orders/${copy.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDuplicating(false);
    }
  };

  const assignAgent = useMutation({
    mutationFn: (agentId: string) => api.commandes.update(id!, { agent_id: agentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commande", id] });
      toast.success("Agent affecté !");
      setSelectedAgent("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateArrival = useMutation({
    mutationFn: (date: string) => api.commandes.update(id!, { estimated_arrival: date || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commande", id] });
      toast.success("Date d'arrivée mise à jour !");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteOrder = useMutation({
    mutationFn: () => api.commandes.delete(id!),
    onSuccess: () => { toast.success("Commande supprimée !"); navigate("/orders"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <DashboardLayout><div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" /></div></DashboardLayout>;
  if (!order) return <DashboardLayout><div className="text-center py-20"><p className="text-muted-foreground">Commande introuvable</p><Link to="/orders" className="text-accent hover:underline mt-2 inline-block">← Retour</Link></div></DashboardLayout>;

  const agentName = agents.find((a) => a.id === order.agent_id)?.full_name;
  const timelineEvents = events.map((e) => ({
    id: e.id, orderId: e.commande_id,
    status: e.status as OrderStatus,
    description: e.description,
    timestamp: e.created_at || "",
    changedByName: e.changed_by_name,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/orders" className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-heading text-foreground">{order.tracking_number}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge label={ORDER_STATUS_LABELS[order.status as OrderStatus]} colorClass={ORDER_STATUS_COLORS[order.status as OrderStatus]} />
              <span className="text-sm text-muted-foreground">{format(new Date(order.created_at), "dd MMMM yyyy", { locale: fr })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => printInvoice(order, agentName)}>
              <Printer className="h-4 w-4 mr-1" />Facture
            </Button>
            {(isAdmin || isAgent) && (
              <Button size="sm" variant="outline" onClick={duplicateOrder} disabled={duplicating}>
                <Copy className="h-4 w-4 mr-1" />{duplicating ? "Duplication..." : "Dupliquer"}
              </Button>
            )}
            {(isAdmin || isAgent) && (
              existingColis ? (
                <Link to={`/colis/${existingColis.id}`}>
                  <Button size="sm" variant="outline"><Package className="h-4 w-4 mr-1" />Voir le colis</Button>
                </Link>
              ) : order.status !== "registered" && (
                <Button size="sm" variant="outline" onClick={() => convertToColis.mutate()} disabled={convertToColis.isPending}>
                  <Package className="h-4 w-4 mr-1" />{convertToColis.isPending ? "Conversion..." : "Convertir en colis"}
                </Button>
              )
            )}
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-1" />Supprimer</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer cette commande ?</AlertDialogTitle>
                    <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteOrder.mutate()}>
                      {deleteOrder.isPending ? "Suppression..." : "Supprimer"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
            <h2 className="font-heading font-semibold text-foreground">Actions Admin</h2>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Commentaire (facultatif, joint au prochain changement de statut)</p>
              <Input value={statusComment} onChange={(e) => setStatusComment(e.target.value)} placeholder="Ex: colis emballé, en attente de dédouanement..." />
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.filter((s) => s !== order.status).map((s) => (
                <Button key={s} size="sm" variant={s === "refused" ? "destructive" : "outline"}
                  onClick={() => updateStatus.mutate(s)} disabled={updateStatus.isPending}>
                  {ORDER_STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
            <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" /> Date d'arrivée estimée
                </p>
                <Input type="date" defaultValue={order.estimated_arrival || ""}
                  onChange={(e) => updateArrival.mutate(e.target.value)} className="max-w-[200px]" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Affecter un agent
                </p>
                <div className="flex items-center gap-2">
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Choisir un agent" /></SelectTrigger>
                    <SelectContent>
                      {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => selectedAgent && assignAgent.mutate(selectedAgent)} disabled={!selectedAgent || assignAgent.isPending}>
                    Affecter
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {(isAdmin || isAgent) && order.affiliate_link_id && (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 flex items-center gap-4 flex-wrap">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Commande passée via un lien d'affiliation{agentName ? ` — ${agentName}` : ""}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.commission_amount != null
                  ? `Commission créditée : ${Number(order.commission_amount).toLocaleString()} F`
                  : "Commission en attente — créditée automatiquement une fois la commande livrée"}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h2 className="font-heading font-semibold text-foreground mb-4">Client</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: User, label: "Nom", value: order.client_name },
                  { icon: Phone, label: "Téléphone", value: order.client_phone },
                  { icon: MapPin, label: "Ville", value: order.city || order.address_to },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium text-foreground">{value}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h2 className="font-heading font-semibold text-foreground mb-4">Produit</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: ShoppingBag, label: "Produit", value: order.product || "-" },
                  { icon: Package, label: "Quantité", value: String(order.quantity) },
                  { icon: DollarSign, label: "Prix", value: `${Number(order.price).toLocaleString()} FCFA` },
                  { icon: Weight, label: "Poids", value: `${order.weight} kg` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium text-foreground">{value}</p></div>
                  </div>
                ))}
              </div>
              {order.product_link && (
                <a href={order.product_link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-accent hover:underline">
                  <ExternalLink className="h-3 w-3" /> Voir le produit
                </a>
              )}
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4" /> Mode : {DELIVERY_MODES[order.delivery_mode] || order.delivery_mode}
              </div>
            </div>

            {agentName && (
              <div className="bg-card rounded-xl border border-border shadow-card p-5">
                <h2 className="font-heading font-semibold text-foreground mb-4">Agent</h2>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-accent text-sm font-bold text-accent-foreground">
                    {agentName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{agentName}</p>
                    <p className="text-xs text-muted-foreground">Agent</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h2 className="font-heading font-semibold text-foreground mb-4">Historique</h2>
            {timelineEvents.length > 0
              ? <TrackingTimeline events={timelineEvents} labels={ORDER_STATUS_LABELS} />
              : <p className="text-sm text-muted-foreground">Aucun événement</p>
            }
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrderDetailPage;
