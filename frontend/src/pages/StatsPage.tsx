import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { StatsCard } from "@/components/StatsCard";
import { Package, Truck, CheckCircle2, DollarSign, Users, MapPin, ShoppingBag, Crown } from "lucide-react";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import type { OrderStatus } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Navigate } from "react-router-dom";

const COLORS = ["hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--info))", "#8884d8", "#82ca9d", "#ffc658"];

const StatsPage = () => {
  const { isAdmin, isAgent } = useAuth();
  const { data: orders = [] } = useQuery({ queryKey: ["commandes"], queryFn: () => api.commandes.list() });
  const { data: agents = [] } = useQuery({ queryKey: ["agents-list"], queryFn: () => api.agents.list(), enabled: isAdmin });

  const totalRevenue = orders.reduce((s, o) => s + Number(o.price), 0);
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const inTransit = orders.filter((o) => ["in_transit", "shipped", "delivering"].includes(o.status)).length;

  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: ORDER_STATUS_LABELS[status as OrderStatus] || status, value: count,
  }));

  const agentMap: Record<string, { name: string; count: number; revenue: number; delivered: number }> = {};
  orders.forEach((o) => {
    if (!o.agent_id) return;
    if (!agentMap[o.agent_id]) agentMap[o.agent_id] = { name: o.agent_id, count: 0, revenue: 0, delivered: 0 };
    agentMap[o.agent_id].count++;
    agentMap[o.agent_id].revenue += Number(o.price);
    if (o.status === "delivered") agentMap[o.agent_id].delivered++;
  });
  agents.forEach((a) => { if (agentMap[a.id]) agentMap[a.id].name = a.full_name; });
  const agentList = Object.values(agentMap).sort((a, b) => b.count - a.count);
  const bestAgent = agentList[0];

  const productCounts: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((o) => {
    const name = o.product?.trim() || "Inconnu";
    if (!productCounts[name]) productCounts[name] = { count: 0, revenue: 0 };
    productCounts[name].count += o.quantity;
    productCounts[name].revenue += Number(o.price);
  });
  const topProducts = Object.entries(productCounts).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.count - a.count).slice(0, 8);

  const cityCounts: Record<string, number> = {};
  orders.forEach((o) => { const c = o.city?.trim() || "Inconnu"; cityCounts[c] = (cityCounts[c] || 0) + 1; });
  const topCities = Object.entries(cityCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  if (!isAdmin && !isAgent) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">{isAdmin ? "Analytics avancés" : "Mes statistiques"}</h1>
          <p className="text-muted-foreground mt-1">{isAdmin ? "Intelligence commerciale et performance" : "Vos ventes, produits et villes les plus actives"}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total commandes" value={orders.length} icon={Package} variant="default" />
          <StatsCard title="En transit" value={inTransit} icon={Truck} variant="accent" />
          <StatsCard title="Livrées" value={delivered} icon={CheckCircle2} variant="success" trend={orders.length > 0 ? `${Math.round((delivered / orders.length) * 100)}% taux` : undefined} />
          <StatsCard title="Valeur totale" value={`${totalRevenue.toLocaleString()} F`} icon={DollarSign} variant="warning" />
        </div>

        {isAdmin && bestAgent && (
          <div className="bg-accent/10 rounded-xl border border-accent/20 p-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-accent text-xl font-bold text-accent-foreground shrink-0">
              <Crown className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">🏆 Meilleur agent</p>
              <p className="text-xl font-bold text-foreground">{bestAgent.name}</p>
              <p className="text-sm text-muted-foreground">{bestAgent.count} commandes · {bestAgent.delivered} livrées · {bestAgent.revenue.toLocaleString()} FCFA</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h2 className="font-heading font-semibold text-foreground mb-4">Répartition par statut</h2>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${value}`} labelLine={false}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground">Aucune donnée</p>}
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-accent" />Produits les plus vendus</h2>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProducts} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v} unités`, "Quantité"]} />
                  <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground">Aucune donnée</p>}
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" />Villes les plus actives</h2>
            {topCities.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topCities}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip formatter={(v: number) => [`${v} commandes`, "Total"]} />
                  <Bar dataKey="count" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground">Aucune donnée</p>}
          </div>

          {isAdmin && <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-accent" />Classement agents</h2>
            {agentList.length === 0 ? <p className="text-sm text-muted-foreground">Aucun agent</p> : (
              <div className="space-y-3">
                {agentList.map((agent, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "gradient-accent text-accent-foreground" : "bg-secondary text-foreground"}`}>{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.count} cmd · {agent.delivered} livrées</p>
                      </div>
                    </div>
                    <p className="font-semibold text-foreground text-sm">{agent.revenue.toLocaleString()} F</p>
                  </div>
                ))}
              </div>
            )}
          </div>}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StatsPage;
