import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/types";
import type { OrderStatus } from "@/lib/types";
import { Package, Truck, CheckCircle2, Clock, DollarSign, TrendingUp, AlertCircle, CreditCard, Percent, Boxes } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isToday, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { isAdmin } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["commandes"],
    queryFn: () => api.commandes.list(),
  });

  const { data: colisList = [] } = useQuery({
    queryKey: ["colis"],
    queryFn: () => api.colis.list(),
  });

  const total = orders.length;
  const inTransit = orders.filter((o) => ["in_transit", "shipped", "delivering"].includes(o.status)).length;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const pending = orders.filter((o) => ["registered", "validated"].includes(o.status)).length;
  const totalRevenue = orders.reduce((s, o) => s + Number(o.price), 0);
  const totalTax = orders.reduce((s, o) => s + Number(o.tax), 0);
  const todayOrders = orders.filter((o) => isToday(new Date(o.created_at)));
  const monthStart = startOfMonth(new Date());
  const monthOrders = orders.filter((o) => new Date(o.created_at) >= monthStart);
  const recentOrders = orders.slice(0, 5);

  const colisEnTransit = colisList.filter((c) => ["en_transit", "arrive_agence", "en_livraison"].includes(c.status)).length;
  const colisLivres = colisList.filter((c) => c.status === "livre").length;
  const colisProbleme = colisList.filter((c) => ["retourne", "perdu"].includes(c.status)).length;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">
            {isAdmin ? "Tableau de bord Admin" : "Mon tableau de bord"}
          </h1>
          <p className="text-muted-foreground mt-1">Vue d'ensemble des opérations d'importation</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total commandes" value={total} icon={Package} variant="default" trend={`${todayOrders.length} aujourd'hui`} />
          <StatsCard title="En transit" value={inTransit} icon={Truck} variant="accent" />
          <StatsCard title="Livrées" value={delivered} icon={CheckCircle2} variant="success" trend={total > 0 ? `${Math.round((delivered / total) * 100)}% taux` : undefined} />
          {isAdmin
            ? <StatsCard title="Total encaissé" value={`${totalRevenue.toLocaleString()} F`} icon={DollarSign} variant="warning" trend={`${todayOrders.reduce((s, o) => s + Number(o.price), 0).toLocaleString()} F aujourd'hui`} />
            : <StatsCard title="En attente" value={pending} icon={Clock} variant="warning" />
          }
        </div>

        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, label: "Ventes du jour", value: `${todayOrders.length} commandes`, sub: `${todayOrders.reduce((s, o) => s + Number(o.price), 0).toLocaleString()} FCFA`, color: "bg-accent/10 text-accent" },
              { icon: CreditCard, label: "Ce mois", value: `${totalRevenue.toLocaleString()} F`, sub: `${monthOrders.length} commandes`, color: "bg-success/10 text-success" },
              { icon: AlertCircle, label: "En attente", value: `${pending}`, sub: "commandes", color: "bg-warning/10 text-warning" },
              { icon: Percent, label: "Taxes collectées", value: `${totalTax.toLocaleString()} F`, sub: "toutes commandes", color: "bg-accent/10 text-accent" },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-xl border border-border shadow-card p-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color} shrink-0`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {!isAdmin && (
            <div className="bg-card rounded-xl border border-border shadow-card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0"><Percent className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Mes taxes</p><p className="text-lg font-bold text-foreground">{totalTax.toLocaleString()} F</p></div>
            </div>
          )}
          <div className="bg-card rounded-xl border border-border shadow-card p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info shrink-0"><Boxes className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Colis en transit</p><p className="text-lg font-bold text-foreground">{colisEnTransit}</p></div>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-card p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success shrink-0"><CheckCircle2 className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Colis livrés</p><p className="text-lg font-bold text-foreground">{colisLivres}</p></div>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-card p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive shrink-0"><AlertCircle className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Colis à surveiller</p><p className="text-lg font-bold text-foreground">{colisProbleme}</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-card">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-heading font-semibold text-foreground">Commandes récentes</h2>
              <Link to="/orders" className="text-sm text-accent hover:underline font-medium">Voir tout →</Link>
            </div>
            <div className="divide-y divide-border">
              {recentOrders.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">Aucune commande pour le moment</div>
              )}
              {recentOrders.map((order) => (
                <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                      <Package className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{order.tracking_number}</p>
                      <p className="text-xs text-muted-foreground truncate">{order.client_name} — {order.product}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge label={ORDER_STATUS_LABELS[order.status as OrderStatus]} colorClass={ORDER_STATUS_COLORS[order.status as OrderStatus]} />
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {format(new Date(order.created_at), "dd MMM", { locale: fr })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
            <h2 className="font-heading font-semibold text-foreground">Résumé</h2>
            <div className="space-y-3">
              {[
                { label: "Nouvelles", value: pending },
                { label: "En transit", value: inTransit },
                { label: "Livrées", value: delivered },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="font-semibold text-foreground">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Valeur totale</span>
                <span className="font-semibold text-accent">{totalRevenue.toLocaleString()} FCFA</span>
              </div>
            </div>
            {isAdmin && (
              <Link to="/stats" className="block text-center text-sm text-accent hover:underline font-medium pt-2">
                Voir les analytics →
              </Link>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
