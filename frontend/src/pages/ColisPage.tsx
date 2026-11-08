import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { COLIS_STATUS_LABELS, COLIS_STATUS_COLORS } from "@/lib/types";
import type { ColisStatus } from "@/lib/types";
import { Link } from "react-router-dom";
import { Search, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { OrdersColisTabs } from "@/components/OrdersColisTabs";

const ALL = "all";
const PAGE_SIZE = 8;

const ColisPage = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [page, setPage] = useState(1);
  const { isAdmin } = useAuth();

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const filterParams = {
    search: debouncedSearch || undefined,
    status: statusFilter !== ALL ? statusFilter : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["colis-page", filterParams, page],
    queryFn: () => api.colis.listPaginated({ ...filterParams, page, limit: PAGE_SIZE }),
  });
  const colisList = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <OrdersColisTabs active="colis" />
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Colis</h1>
          <p className="text-muted-foreground mt-1">{total} colis au total</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par n° suivi, client, destination..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-52"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les statuts</SelectItem>
              {Object.entries(COLIS_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-semibold text-foreground">N° Suivi</th>
                    <th className="text-left p-4 font-semibold text-foreground">Client</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden md:table-cell">Destination</th>
                    {isAdmin && <th className="text-left p-4 font-semibold text-foreground hidden lg:table-cell">Agent</th>}
                    <th className="text-left p-4 font-semibold text-foreground hidden lg:table-cell">Transporteur</th>
                    <th className="text-left p-4 font-semibold text-foreground">Statut</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Créé le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {colisList.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4"><Link to={`/colis/${c.id}`} className="text-accent font-medium hover:underline">{c.tracking_number}</Link></td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">{c.client_name}</p>
                        <p className="text-xs text-muted-foreground">{c.client_phone}</p>
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{c.destination || "-"}</td>
                      {isAdmin && <td className="p-4 text-muted-foreground hidden lg:table-cell">{c.agent_name || "-"}</td>}
                      <td className="p-4 text-muted-foreground hidden lg:table-cell">{c.carrier || "-"}</td>
                      <td className="p-4">
                        <StatusBadge label={COLIS_STATUS_LABELS[c.status as ColisStatus] || c.status} colorClass={COLIS_STATUS_COLORS[c.status as ColisStatus] || ""} />
                      </td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">{format(new Date(c.created_at), "dd MMM yyyy", { locale: fr })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total === 0 && (
              <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Package className="h-8 w-8 text-muted-foreground/40" />
                Aucun colis trouvé
              </div>
            )}
            {total > 0 && (
              <div className="p-4 border-t border-border">
                <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPageChange={setPage} itemLabel="colis" />
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ColisPage;
