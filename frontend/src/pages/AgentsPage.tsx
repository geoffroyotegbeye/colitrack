import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiUser } from "@/lib/api";
import { Users, Plus, Ban, CheckCircle2, History, DollarSign, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, type OrderStatus } from "@/lib/types";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/TablePagination";

function AgentCard({ agent, onStatusChange }: {
  agent: ApiUser;
  onStatusChange: (status: "active" | "suspended") => void;
}) {
  const [activityOpen, setActivityOpen] = useState(false);
  const [confirmingStatus, setConfirmingStatus] = useState(false);
  const { data: stats } = useQuery({ queryKey: ["agent-stats", agent.id], queryFn: () => api.agents.stats(agent.id) });
  const { data: activity = [] } = useQuery({
    queryKey: ["agent-activity", agent.id], queryFn: () => api.agents.activity(agent.id), enabled: activityOpen,
  });
  const suspended = agent.status === "suspended";

  return (
    <div className={cn("bg-card rounded-xl border shadow-card p-5 space-y-4", suspended ? "border-destructive/40 opacity-75" : "border-border")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-accent text-lg font-bold text-accent-foreground">
            {agent.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-foreground">{agent.full_name}</p>
            <p className="text-xs text-muted-foreground">{agent.email}</p>
            {agent.phone && <p className="text-xs text-muted-foreground">{agent.phone}</p>}
          </div>
        </div>
        {suspended && <span className="text-[10px] font-semibold uppercase tracking-wide text-destructive bg-destructive/10 rounded-full px-2 py-0.5">Suspendu</span>}
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-muted/50 rounded-lg p-2"><p className="text-lg font-bold text-foreground">{stats?.clicks ?? "-"}</p><p className="text-[10px] text-muted-foreground">Clics</p></div>
        <div className="bg-muted/50 rounded-lg p-2"><p className="text-lg font-bold text-foreground">{stats?.orders_count ?? "-"}</p><p className="text-[10px] text-muted-foreground">Commandes</p></div>
        <div className="bg-muted/50 rounded-lg p-2"><p className="text-lg font-bold text-warning">{stats ? stats.commission_due.toLocaleString() : "-"}</p><p className="text-[10px] text-muted-foreground">Due (F)</p></div>
        <div className="bg-muted/50 rounded-lg p-2"><p className="text-lg font-bold text-success">{stats ? stats.commission_paid.toLocaleString() : "-"}</p><p className="text-[10px] text-muted-foreground">Payée (F)</p></div>
      </div>

      <div className="border-t border-border pt-3 flex items-center justify-end gap-3">
        <div className="flex items-center gap-1.5">
          <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" title="Activité récente"><History className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Ventes récentes — {agent.full_name}</DialogTitle></DialogHeader>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune vente via un lien d'affiliation pour l'instant</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {activity.map((a) => (
                    <div key={a.id} className="text-sm border-b border-border pb-2 last:border-0 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-foreground font-medium">{a.product || a.tracking_number}</p>
                        <p className="text-xs text-muted-foreground">{a.tracking_number} · {format(new Date(a.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <StatusBadge label={ORDER_STATUS_LABELS[a.status as OrderStatus] || a.status} colorClass={ORDER_STATUS_COLORS[a.status as OrderStatus] || "bg-muted text-muted-foreground"} />
                        {a.commission_amount != null && (
                          <p className={cn("text-xs mt-1 font-medium", a.commission_paid_at ? "text-success" : "text-warning")}>
                            {a.commission_amount.toLocaleString()} F {a.commission_paid_at ? "payée" : "due"}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Button
            size="icon" variant="ghost" className={cn("h-8 w-8", suspended ? "text-success" : "text-destructive")}
            title={suspended ? "Réactiver" : "Suspendre"}
            onClick={() => setConfirmingStatus(true)}
          >
            {suspended ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {agent.created_at && (
        <p className="text-xs text-muted-foreground">Depuis le {format(new Date(agent.created_at), "dd MMM yyyy", { locale: fr })}</p>
      )}

      <ConfirmDialog
        open={confirmingStatus}
        onOpenChange={setConfirmingStatus}
        title={suspended ? `Réactiver ${agent.full_name} ?` : `Suspendre ${agent.full_name} ?`}
        description={suspended ? "Cet agent retrouvera l'accès à la plateforme." : "Cet agent n'aura plus accès à la plateforme jusqu'à réactivation."}
        confirmLabel={suspended ? "Réactiver" : "Suspendre"}
        destructive={!suspended}
        onConfirm={() => { onStatusChange(suspended ? "active" : "suspended"); setConfirmingStatus(false); }}
      />
    </div>
  );
}

function CommissionsSection() {
  const queryClient = useQueryClient();
  const [paying, setPaying] = useState<string | null>(null);

  const { data: summary = [], isLoading } = useQuery({
    queryKey: ["agents-commission-summary"],
    queryFn: () => api.affiliate.agentsSummary(),
  });

  const payAgent = useMutation({
    mutationFn: (agentId: string) => api.affiliate.payAgent(agentId),
    onSuccess: (res) => {
      toast.success(`${res.total_paid.toLocaleString()} F marqué(s) payé(s)`);
      queryClient.invalidateQueries({ queryKey: ["agents-commission-summary"] });
      setPaying(null);
    },
    onError: (e: any) => { toast.error(e.message); setPaying(null); },
  });

  if (isLoading || summary.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Wallet className="h-4 w-4 text-accent" />
        <h2 className="font-heading font-semibold text-foreground text-sm">Commissions d'affiliation</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 font-semibold text-foreground">Agent</th>
              <th className="text-left p-4 font-semibold text-foreground">Commission due</th>
              <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Déjà payée</th>
              <th className="text-left p-4 font-semibold text-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {summary.map((a) => (
              <tr key={a.agent_id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <p className="font-medium text-foreground">{a.full_name}</p>
                  <p className="text-xs text-muted-foreground">{a.email}</p>
                </td>
                <td className="p-4 font-semibold text-warning">{a.total_due.toLocaleString()} F</td>
                <td className="p-4 text-success hidden sm:table-cell">{a.total_paid.toLocaleString()} F</td>
                <td className="p-4">
                  <Button
                    size="sm" variant="outline" className="gap-1.5" disabled={a.total_due === 0 || paying === a.agent_id}
                    onClick={() => setPaying(a.agent_id)}
                  >
                    <DollarSign className="h-3.5 w-3.5" />Marquer payé
                  </Button>
                  <ConfirmDialog
                    open={paying === a.agent_id}
                    onOpenChange={(o) => !o && setPaying(null)}
                    title={`Marquer ${a.total_due.toLocaleString()} F comme payé à ${a.full_name} ?`}
                    description="Confirme uniquement que tu as bien réglé cette commission (ex: Mobile Money, virement) en dehors de l'app. Cette action ne déclenche aucun paiement réel."
                    confirmLabel="Confirmer le paiement"
                    destructive={false}
                    pending={payAgent.isPending}
                    onConfirm={() => payAgent.mutate(a.agent_id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const PAGE_SIZE = 8;

const AgentsPage = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["agents-page", page],
    queryFn: () => api.agents.listPaginated({ page, limit: PAGE_SIZE }),
  });
  const agents = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["agents-page"] });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "suspended" }) => api.agents.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(status === "suspended" ? "Agent suspendu" : "Agent réactivé");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createAgent = useMutation({
    mutationFn: () => api.auth.register(newAgent.full_name, newAgent.email, newAgent.password, newAgent.phone || undefined)
      .then(({ user }) => api.agents.updateRole(user.id, "agent")),
    onSuccess: () => {
      toast.success("Agent créé !");
      invalidate();
      setCreateOpen(false);
      setNewAgent({ full_name: "", email: "", phone: "", password: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const set = (k: keyof typeof newAgent) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setNewAgent((p) => ({ ...p, [k]: e.target.value }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Agents</h1>
            <p className="text-muted-foreground mt-1">{total} agents</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />Créer un agent</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Créer un nouvel agent</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createAgent.mutate(); }} className="space-y-4">
                <div className="space-y-2"><Label>Nom complet *</Label><Input value={newAgent.full_name} onChange={set("full_name")} required /></div>
                <div className="space-y-2"><Label>Email *</Label><Input type="email" value={newAgent.email} onChange={set("email")} required /></div>
                <div className="space-y-2"><Label>Téléphone</Label><PhoneInput value={newAgent.phone} onChange={set("phone")} /></div>
                <div className="space-y-2"><Label>Mot de passe *</Label><Input type="password" value={newAgent.password} onChange={set("password")} required minLength={6} /></div>
                <Button type="submit" className="w-full" disabled={createAgent.isPending}>
                  {createAgent.isPending ? "Création..." : "Créer l'agent"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <CommissionsSection />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        ) : total === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Aucun agent</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onStatusChange={(status) => updateStatus.mutate({ id: agent.id, status })}
                />
              ))}
            </div>
            <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPageChange={setPage} itemLabel="agent(s)" />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AgentsPage;
