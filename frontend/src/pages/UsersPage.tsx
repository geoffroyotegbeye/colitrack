import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiUser } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Users, Ban, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const ALL = "all";
const PAGE_SIZE = 8;

const UsersPage = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [roleFilter, setRoleFilter] = useState(ALL);
  const [page, setPage] = useState(1);
  const [statusTarget, setStatusTarget] = useState<ApiUser | null>(null);

  useEffect(() => { setPage(1); }, [debouncedSearch, roleFilter]);

  const filterParams = {
    search: debouncedSearch || undefined,
    role: roleFilter !== ALL ? roleFilter : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["users-page", filterParams, page],
    queryFn: () => api.users.listPaginated({ ...filterParams, page, limit: PAGE_SIZE }),
  });
  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users-page"] });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.agents.updateRole(id, role),
    onSuccess: () => { toast.success("Rôle mis à jour"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "suspended" }) => api.users.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(status === "suspended" ? "Compte suspendu" : "Compte réactivé");
      invalidate();
      setStatusTarget(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Utilisateurs</h1>
          <p className="text-muted-foreground mt-1">{total} utilisateur(s) — admins, agents et clients</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Rechercher par nom ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="sm:w-48"><SelectValue placeholder="Rôle" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les rôles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        ) : total === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Aucun utilisateur</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-semibold text-foreground">Nom</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden md:table-cell">Contact</th>
                    <th className="text-left p-4 font-semibold text-foreground">Rôle</th>
                    <th className="text-left p-4 font-semibold text-foreground">Statut</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Inscrit le</th>
                    <th className="text-left p-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => {
                    const self = u.id === user?.id;
                    const suspended = u.status === "suspended";
                    return (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium text-foreground">{u.full_name}{self && <span className="ml-2 text-xs text-muted-foreground">(vous)</span>}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">
                          <p>{u.email}</p>
                          {u.phone && <p className="text-xs">{u.phone}</p>}
                        </td>
                        <td className="p-4">
                          <Select defaultValue={u.role} disabled={self} onValueChange={(role) => updateRole.mutate({ id: u.id, role })}>
                            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="client">Client</SelectItem>
                              <SelectItem value="agent">Agent</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-4">
                          <span className={cn("text-xs font-semibold uppercase tracking-wide rounded-full px-2 py-0.5",
                            suspended ? "text-destructive bg-destructive/10" : "text-success bg-success/10")}>
                            {suspended ? "Suspendu" : "Actif"}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground hidden sm:table-cell">{format(new Date(u.created_at!), "dd MMM yyyy", { locale: fr })}</td>
                        <td className="p-4">
                          <Button
                            size="icon" variant="ghost" className={cn("h-8 w-8", suspended ? "text-success" : "text-destructive")}
                            disabled={self} title={self ? "Impossible sur votre propre compte" : suspended ? "Réactiver" : "Suspendre"}
                            onClick={() => setStatusTarget(u)}
                          >
                            {suspended ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border">
              <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPageChange={setPage} itemLabel="utilisateur(s)" />
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!statusTarget}
          onOpenChange={(o) => { if (!o) setStatusTarget(null); }}
          title={statusTarget?.status === "suspended" ? `Réactiver ${statusTarget?.full_name} ?` : `Suspendre ${statusTarget?.full_name} ?`}
          description={statusTarget?.status === "suspended" ? "Ce compte retrouvera l'accès à la plateforme." : "Ce compte n'aura plus accès à la plateforme jusqu'à réactivation."}
          confirmLabel={statusTarget?.status === "suspended" ? "Réactiver" : "Suspendre"}
          destructive={statusTarget?.status !== "suspended"}
          pending={updateStatus.isPending}
          onConfirm={() => statusTarget && updateStatus.mutate({ id: statusTarget.id, status: statusTarget.status === "suspended" ? "active" : "suspended" })}
        />
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;
