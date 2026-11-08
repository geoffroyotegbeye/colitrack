import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { api, type ClientSummary } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/types";
import type { OrderStatus } from "@/lib/types";
import { Contact, Search, UserCheck, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const PAGE_SIZE = 8;

const ClientsPage = () => {
  const { isAdmin, isAgent } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ClientSummary | null>(null);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ["clients-page", debouncedSearch, page],
    queryFn: () => api.clients.listPaginated({ search: debouncedSearch || undefined, page, limit: PAGE_SIZE }),
  });
  const clients = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const { data: selectedOrders = [] } = useQuery({
    queryKey: ["client-orders", selected?.phone],
    queryFn: () => api.clients.orders(selected!.phone),
    enabled: !!selected,
  });

  if (!isAdmin && !isAgent) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">{total} client(s) — d'après l'historique des commandes</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom ou téléphone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        ) : total === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
            <Contact className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Aucun client</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-semibold text-foreground">Client</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Commandes</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden md:table-cell">Total dépensé</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden lg:table-cell">Dernière commande</th>
                    <th className="text-left p-4 font-semibold text-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.map((c) => (
                    <tr key={c.phone} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelected(c)}>
                      <td className="p-4">
                        <p className="font-medium text-foreground flex items-center gap-1.5">
                          {c.name}
                          {c.has_account && <UserCheck className="h-3.5 w-3.5 text-success" aria-label="Compte enregistré" />}
                        </p>
                        <p className="text-xs text-muted-foreground">{c.phone}</p>
                      </td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">{c.orders_count}</td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{Number(c.total_spent).toLocaleString()} F</td>
                      <td className="p-4 text-muted-foreground hidden lg:table-cell">{format(new Date(c.last_order_at), "dd MMM yyyy", { locale: fr })}</td>
                      <td className="p-4 text-accent"><History className="h-4 w-4" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border">
              <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPageChange={setPage} itemLabel="client(s)" />
            </div>
          </div>
        )}

        <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{selected?.name} — historique</DialogTitle></DialogHeader>
            {selected && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{selected.phone} · {selected.orders_count} commande(s) · {Number(selected.total_spent).toLocaleString()} F au total</p>
                <div className="divide-y divide-border">
                  {selectedOrders.map((o) => (
                    <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between py-3 hover:bg-muted/30 -mx-1 px-1 rounded-lg transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-accent truncate">{o.tracking_number}</p>
                        <p className="text-xs text-muted-foreground truncate">{o.product} · {format(new Date(o.created_at), "dd MMM yyyy", { locale: fr })}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-foreground">{Number(o.price).toLocaleString()} F</span>
                        <StatusBadge label={ORDER_STATUS_LABELS[o.status as OrderStatus]} colorClass={ORDER_STATUS_COLORS[o.status as OrderStatus]} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ClientsPage;
