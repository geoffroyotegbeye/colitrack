import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { TrackingTimeline } from "@/components/TrackingTimeline";
import { QrCode } from "@/components/QrCode";
import { COLIS_STATUS_LABELS, COLIS_STATUS_COLORS } from "@/lib/types";
import type { ColisStatus } from "@/lib/types";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, User, Weight, Truck, Ruler, Package } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";

const ALL_COLIS_STATUSES: ColisStatus[] = ["recu", "en_attente", "emballe", "en_transit", "arrive_agence", "en_livraison", "livre", "retourne", "perdu"];

const ColisDetailPage = () => {
  const { id } = useParams();
  const { isAdmin, isAgent } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [carrier, setCarrier] = useState("");

  const { data: colis, isLoading } = useQuery({
    queryKey: ["colis", id],
    queryFn: () => api.colis.get(id!),
    enabled: !!id,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["colis-history", id],
    queryFn: () => api.colis.history(id!),
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) =>
      api.colis.update(id!, { status, description: comment.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colis", id] });
      queryClient.invalidateQueries({ queryKey: ["colis-history", id] });
      setComment("");
      toast.success("Statut du colis mis à jour !");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateCarrier = useMutation({
    mutationFn: () => api.colis.update(id!, { carrier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colis", id] });
      toast.success("Transporteur mis à jour !");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <DashboardLayout><div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" /></div></DashboardLayout>;
  if (!colis) return <DashboardLayout><div className="text-center py-20"><p className="text-muted-foreground">Colis introuvable</p><Link to="/colis" className="text-accent hover:underline mt-2 inline-block">← Retour</Link></div></DashboardLayout>;

  const timelineEvents = events.map((e) => ({
    id: e.id, status: e.status, description: e.description,
    timestamp: e.created_at, changedByName: e.changed_by_name,
  }));
  const trackingUrl = `${window.location.origin}/tracking?number=${colis.commande_tracking_number}`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/colis" className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-heading text-foreground">{colis.tracking_number}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge label={COLIS_STATUS_LABELS[colis.status as ColisStatus] || colis.status} colorClass={COLIS_STATUS_COLORS[colis.status as ColisStatus] || ""} />
              <span className="text-sm text-muted-foreground">{format(new Date(colis.created_at), "dd MMMM yyyy", { locale: fr })}</span>
            </div>
          </div>
          <Link to={`/orders/${colis.commande_id}`}>
            <Button size="sm" variant="outline"><Package className="h-4 w-4 mr-1" />Voir la commande</Button>
          </Link>
        </div>

        {(isAdmin || isAgent) && (
          <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
            <h2 className="font-heading font-semibold text-foreground">Changer le statut</h2>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Commentaire (facultatif)</p>
              <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ex: laissé au dépôt, tentative de livraison échouée..." />
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_COLIS_STATUSES.filter((s) => s !== colis.status).map((s) => (
                <Button key={s} size="sm" variant={s === "perdu" || s === "retourne" ? "destructive" : "outline"}
                  onClick={() => updateStatus.mutate(s)} disabled={updateStatus.isPending}>
                  {COLIS_STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2"><Truck className="h-4 w-4" /> Transporteur</p>
              <div className="flex items-center gap-2">
                <Input defaultValue={colis.carrier || ""} onChange={(e) => setCarrier(e.target.value)} placeholder="Ex: DHL, transporteur local..." className="max-w-xs" />
                <Button size="sm" onClick={() => updateCarrier.mutate()} disabled={updateCarrier.isPending}>Enregistrer</Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h2 className="font-heading font-semibold text-foreground mb-4">Client</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: User, label: "Nom", value: colis.client_name },
                  { icon: Phone, label: "Téléphone", value: colis.client_phone },
                  { icon: MapPin, label: "Destination", value: colis.destination || "-" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium text-foreground">{value}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h2 className="font-heading font-semibold text-foreground mb-4">Détails du colis</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { icon: Weight, label: "Poids", value: `${colis.weight} kg` },
                  { icon: Ruler, label: "Dimensions", value: colis.dimensions || "-" },
                  { icon: Truck, label: "Transporteur", value: colis.carrier || "-" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium text-foreground">{value}</p></div>
                  </div>
                ))}
              </div>
              {colis.agent_name && (
                <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border">Agent responsable : <span className="font-medium text-foreground">{colis.agent_name}</span></p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border shadow-card p-5 flex flex-col items-center text-center">
              <h2 className="font-heading font-semibold text-foreground mb-4 self-start">QR Code de suivi</h2>
              <QrCode value={trackingUrl} />
              <p className="text-xs text-muted-foreground mt-3">Scanner pour suivre ce colis</p>
            </div>
            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h2 className="font-heading font-semibold text-foreground mb-4">Historique</h2>
              {timelineEvents.length > 0
                ? <TrackingTimeline events={timelineEvents} labels={COLIS_STATUS_LABELS} />
                : <p className="text-sm text-muted-foreground">Aucun événement</p>
              }
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ColisDetailPage;
