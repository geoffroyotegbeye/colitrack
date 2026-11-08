import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DollarSign } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/types";
import type { OrderStatus } from "@/lib/types";
import { Link } from "react-router-dom";

const PaymentsPage = () => {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["commandes"],
    queryFn: () => api.commandes.list(),
  });

  const totalRevenue = orders.reduce((s, o) => s + Number(o.price), 0);
  const totalTax = orders.reduce((s, o) => s + Number(o.tax), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Paiements</h1>
          <p className="text-muted-foreground mt-1">
            Total commandes : <span className="font-semibold text-accent">{totalRevenue.toLocaleString()} FCFA</span>
            {totalTax > 0 && <> · Taxes : <span className="font-semibold text-warning">{totalTax.toLocaleString()} FCFA</span></>}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0"><DollarSign className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Valeur totale</p><p className="text-lg font-bold text-foreground">{totalRevenue.toLocaleString()} FCFA</p></div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success shrink-0"><DollarSign className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Commandes livrées</p><p className="text-lg font-bold text-foreground">{orders.filter((o) => o.status === "delivered").length}</p></div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning shrink-0"><DollarSign className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Total taxes</p><p className="text-lg font-bold text-foreground">{totalTax.toLocaleString()} FCFA</p></div>
          </div>
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
                    <th className="text-left p-4 font-semibold text-foreground">Prix</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Taxe</th>
                    <th className="text-left p-4 font-semibold text-foreground">Statut</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <Link to={`/orders/${o.id}`} className="text-accent font-medium hover:underline">{o.tracking_number}</Link>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">{o.client_name}</p>
                        <p className="text-xs text-muted-foreground">{o.client_phone}</p>
                      </td>
                      <td className="p-4 font-semibold text-foreground">{Number(o.price).toLocaleString()} F</td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">{Number(o.tax) > 0 ? `${Number(o.tax).toLocaleString()} F` : "—"}</td>
                      <td className="p-4"><StatusBadge label={ORDER_STATUS_LABELS[o.status as OrderStatus]} colorClass={ORDER_STATUS_COLORS[o.status as OrderStatus]} /></td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">{format(new Date(o.created_at), "dd MMM yyyy", { locale: fr })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {orders.length === 0 && <div className="p-8 text-center text-muted-foreground">Aucune commande</div>}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentsPage;
