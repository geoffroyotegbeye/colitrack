import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { IdCard, CheckCircle2, XCircle, MapPin, Briefcase, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "pending", label: "En attente" },
  { value: "active", label: "Validées" },
  { value: "rejected", label: "Rejetées" },
];

const AgentApplicationsPage = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [rejecting, setRejecting] = useState<string | null>(null);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["agent-applications", status],
    queryFn: () => api.digimarket.listApplications(status),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: "active" | "rejected" }) =>
      api.digimarket.updateApplicationStatus(id, newStatus),
    onSuccess: (_, { newStatus }) => {
      toast.success(newStatus === "active" ? "Candidature validée, agent activé" : "Candidature rejetée");
      queryClient.invalidateQueries({ queryKey: ["agent-applications"] });
      setRejecting(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Demandes pour devenir agent</h1>
          <p className="text-muted-foreground mt-1">Valider une candidature donne directement le rôle agent ; le rejet n'y touche pas.</p>
        </div>

        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatus(t.value)}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium", status === t.value ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
            <IdCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Aucune candidature</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {applications.map((a) => (
              <div key={a.id} className="bg-card rounded-xl border border-border shadow-card p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5 shrink-0">
                    {a.id_card_url && (
                      <a href={a.id_card_url} target="_blank" rel="noreferrer" title="Carte d'identité">
                        <img src={a.id_card_url} alt="Carte d'identité" className="h-14 w-14 object-cover rounded-lg border border-border" />
                      </a>
                    )}
                    {a.selfie_url && (
                      <a href={a.selfie_url} target="_blank" rel="noreferrer" title="Selfie">
                        <img src={a.selfie_url} alt="Selfie" className="h-14 w-14 object-cover rounded-lg border border-border" />
                      </a>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{a.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.email}{a.phone ? ` · ${a.phone}` : ""}</p>
                    {a.id_card_number && <p className="text-xs text-muted-foreground">CNI n° {a.id_card_number}</p>}
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t border-border pt-3">
                  <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />{[a.address, a.city, a.country].filter(Boolean).join(", ") || "—"}</p>
                  <p className="flex items-start gap-2 text-muted-foreground"><Briefcase className="h-3.5 w-3.5 mt-0.5 shrink-0" />{a.occupation || "—"}</p>
                  <p className="flex items-start gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5 mt-0.5 shrink-0" />Urgence : {a.emergency_contact_name || "—"}{a.emergency_contact_phone ? ` (${a.emergency_contact_phone})` : ""}</p>
                  {a.motivation && <p className="text-foreground text-sm bg-muted/50 rounded-lg p-3 italic">"{a.motivation}"</p>}
                </div>

                {status === "pending" && (
                  <div className="flex items-center gap-2 border-t border-border pt-3">
                    <Button size="sm" variant="outline" className="gap-1.5 text-destructive flex-1" onClick={() => setRejecting(a.id)}>
                      <XCircle className="h-3.5 w-3.5" />Rejeter
                    </Button>
                    <Button size="sm" className="gap-1.5 flex-1" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: a.id, newStatus: "active" })}>
                      <CheckCircle2 className="h-3.5 w-3.5" />Valider
                    </Button>
                  </div>
                )}
                <ConfirmDialog
                  open={rejecting === a.id}
                  onOpenChange={(o) => !o && setRejecting(null)}
                  title={`Rejeter la candidature de ${a.full_name} ?`}
                  description="Il pourra soumettre une nouvelle candidature plus tard."
                  confirmLabel="Rejeter"
                  destructive
                  pending={updateStatus.isPending}
                  onConfirm={() => updateStatus.mutate({ id: a.id, newStatus: "rejected" })}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AgentApplicationsPage;
