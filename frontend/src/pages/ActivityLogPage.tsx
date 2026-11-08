import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { History, Package, Boxes, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const ALL = "all";
const PAGE_SIZE = 8;

const ActivityLogPage = () => {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [agentFilter, setAgentFilter] = useState(ALL);
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter, agentFilter]);

  const filterParams = {
    search: debouncedSearch || undefined,
    type: typeFilter !== ALL ? typeFilter : undefined,
    agent_id: agentFilter !== ALL ? agentFilter : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["activity-page", filterParams, page],
    queryFn: () => api.activity.listPaginated({ ...filterParams, page, limit: PAGE_SIZE }),
  });
  const activity = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const { data: agents = [] } = useQuery({ queryKey: ["agents-list"], queryFn: () => api.agents.list() });

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Journal d'activité</h1>
          <p className="text-muted-foreground mt-1">{total} action(s), tous agents confondus</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par n° suivi, auteur, commentaire..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="sm:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous types</SelectItem>
              <SelectItem value="commande">Commandes</SelectItem>
              <SelectItem value="colis">Colis</SelectItem>
            </SelectContent>
          </Select>
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="sm:w-52"><SelectValue placeholder="Agent" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les agents</SelectItem>
              {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        ) : total === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
            <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Aucune activité</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-card divide-y divide-border">
            {activity.map((a) => (
              <div key={`${a.type}-${a.id}`} className="flex items-start gap-3 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 shrink-0 mt-0.5">
                  {a.type === "commande" ? <Package className="h-4 w-4 text-accent" /> : <Boxes className="h-4 w-4 text-accent" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <Link to={a.type === "commande" ? `/orders/${a.ref_id}` : `/colis/${a.ref_id}`} className="font-medium text-accent hover:underline">{a.ref}</Link>
                    {" → "}<span className="font-medium">{a.status}</span>
                    {a.description && <span className="text-muted-foreground"> · {a.description}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.agent_name && <>Agent : {a.agent_name} · </>}
                    par {a.changed_by_name || "système"} · {format(new Date(a.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {total > 0 && (
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPageChange={setPage} itemLabel="action(s)" />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ActivityLogPage;
