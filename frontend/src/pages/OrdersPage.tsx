import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/types";
import type { OrderStatus } from "@/lib/types";
import { Link } from "react-router-dom";
import { Search, Plus, Download, Trash2, Link2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { OrdersColisTabs } from "@/components/OrdersColisTabs";

const ALL = "all";
const PAGE_SIZE = 8;

const OrdersPage = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [agentFilter, setAgentFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const resetFilters = () => {
    setSearch(""); setAgentFilter(ALL); setStatusFilter(ALL); setDateFrom(""); setDateTo("");
  };
  const hasActiveFilters = search || agentFilter !== ALL || statusFilter !== ALL || dateFrom || dateTo;

  useEffect(() => { setPage(1); }, [debouncedSearch, agentFilter, statusFilter, dateFrom, dateTo]);

  const filterParams = {
    search: debouncedSearch || undefined,
    agent_id: isAdmin && agentFilter !== ALL ? agentFilter : undefined,
    status: statusFilter !== ALL ? statusFilter : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["commandes-page", filterParams, page],
    queryFn: () => api.commandes.listPaginated({ ...filterParams, page, limit: PAGE_SIZE }),
  });
  const orders = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => api.agents.list(),
    enabled: isAdmin,
  });

  const pageAllSelected = orders.length > 0 && orders.every((o) => selected.has(o.id));
  const toggleSelect = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => setSelected((prev) => {
    const next = new Set(prev);
    if (pageAllSelected) orders.forEach((o) => next.delete(o.id));
    else orders.forEach((o) => next.add(o.id));
    return next;
  });

  const deleteMutation = useMutation({
    mutationFn: () => Promise.all(Array.from(selected).map((id) => api.commandes.delete(id))),
    onSuccess: () => {
      toast.success(`${selected.size} commande(s) supprimée(s)`);
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["commandes-page"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const exportCSV = useCallback(async () => {
    const full = await api.commandes.listPaginated({ ...filterParams, page: 1, limit: 10000 });
    if (!full.data.length) return;
    const headers = ["N° Suivi", "Client", "Téléphone", "Agent", "Ville", "Produit", "Qté", "Prix (FCFA)", "Taxe (FCFA)", "Poids (kg)", "Mode", "Statut", "Date"];
    const rows = full.data.map((o) => [
      o.tracking_number, o.client_name, o.client_phone, o.agent_name || "", o.city,
      o.product || "", o.quantity, o.price, o.tax, o.weight, o.delivery_mode,
      ORDER_STATUS_LABELS[o.status as OrderStatus] || o.status,
      format(new Date(o.created_at), "dd/MM/yyyy", { locale: fr }),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `commandes_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, agentFilter, statusFilter, dateFrom, dateTo]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <OrdersColisTabs active="orders" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Commandes</h1>
            <p className="text-muted-foreground mt-1">
              {hasActiveFilters ? `${total} commande(s) trouvée(s)` : `${total} commandes au total`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />Exporter CSV</Button>
            <Link to="/orders/new">
              <Button className="gradient-accent text-accent-foreground hover:opacity-90 shadow-card">
                <Plus className="h-4 w-4 mr-2" />Nouvelle commande
              </Button>
            </Link>
          </div>
        </div>

        {isAdmin && selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <span className="text-sm font-medium text-foreground">{selected.size} sélectionnée(s)</span>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} disabled={deleteMutation.isPending}>
              <Trash2 className="h-4 w-4 mr-2" />{deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Annuler</Button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par n° suivi, client, produit..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          {isAdmin && (
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="lg:w-48"><SelectValue placeholder="Agent" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tous les agents</SelectItem>
                {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="lg:w-52"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les statuts</SelectItem>
              {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="lg:w-40" aria-label="Date de début" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="lg:w-40" aria-label="Date de fin" />
          {hasActiveFilters && (
            <Button variant="ghost" onClick={resetFilters} className="text-muted-foreground shrink-0">Réinitialiser</Button>
          )}
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
                    {isAdmin && <th className="p-4 w-10"><Checkbox checked={pageAllSelected} onCheckedChange={toggleAll} /></th>}
                    <th className="text-left p-4 font-semibold text-foreground">N° Suivi</th>
                    <th className="text-left p-4 font-semibold text-foreground">Client</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden md:table-cell">Produit</th>
                    {isAdmin && <th className="text-left p-4 font-semibold text-foreground hidden lg:table-cell">Agent</th>}
                    <th className="text-left p-4 font-semibold text-foreground hidden lg:table-cell">Qté</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden lg:table-cell">Prix</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden xl:table-cell">Taxe</th>
                    <th className="text-left p-4 font-semibold text-foreground">Statut</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <tr key={order.id} className={`hover:bg-muted/30 transition-colors ${selected.has(order.id) ? "bg-primary/5" : ""}`}>
                      {isAdmin && <td className="p-4"><Checkbox checked={selected.has(order.id)} onCheckedChange={() => toggleSelect(order.id)} /></td>}
                      <td className="p-4">
                        <Link to={`/orders/${order.id}`} className="text-accent font-medium hover:underline inline-flex items-center gap-1.5">
                          {order.tracking_number}
                          {order.affiliate_link_id && <Link2 className="h-3 w-3 text-muted-foreground shrink-0" aria-label="Via lien d'affiliation" />}
                        </Link>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">{order.client_name}</p>
                        <p className="text-xs text-muted-foreground">{order.client_phone}</p>
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell truncate max-w-[200px]">{order.product || "-"}</td>
                      {isAdmin && <td className="p-4 text-muted-foreground hidden lg:table-cell">{order.agent_name || "-"}</td>}
                      <td className="p-4 text-foreground hidden lg:table-cell">{order.quantity}</td>
                      <td className="p-4 font-medium text-foreground hidden lg:table-cell">{Number(order.price).toLocaleString()} F</td>
                      <td className="p-4 text-muted-foreground hidden xl:table-cell">{Number(order.tax).toLocaleString()} F</td>
                      <td className="p-4"><StatusBadge label={ORDER_STATUS_LABELS[order.status as OrderStatus]} colorClass={ORDER_STATUS_COLORS[order.status as OrderStatus]} /></td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">{format(new Date(order.created_at), "dd MMM yyyy", { locale: fr })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total === 0 && <div className="p-8 text-center text-muted-foreground">Aucune commande trouvée</div>}
            {total > 0 && (
              <div className="p-4 border-t border-border">
                <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPageChange={setPage} itemLabel="commande(s)" />
              </div>
            )}
          </div>
        )}

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer {selected.size} commande(s) ?</AlertDialogTitle>
              <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate()}>Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default OrdersPage;
