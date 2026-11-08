import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { Package, Copy, Check, MousePointerClick, ShoppingCart, DollarSign, Clock, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

const AffiliationPage = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["my-affiliate-links"],
    queryFn: () => api.affiliate.myLinks(),
  });

  const totalDue = links.reduce((s, l) => s + l.total_due, 0);
  const totalPaid = links.reduce((s, l) => s + l.total_paid, 0);
  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
  const totalOrders = links.reduce((s, l) => s + l.orders_count, 0);

  const copyLink = (id: string, code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Mes affiliations</h1>
          <p className="text-muted-foreground mt-1">Vos liens produits, leurs performances et vos commissions</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { icon: Store, label: "Liens actifs", value: links.length, color: "bg-accent/10 text-accent" },
            { icon: MousePointerClick, label: "Clics totaux", value: totalClicks, color: "bg-info/10 text-info" },
            { icon: ShoppingCart, label: "Commandes générées", value: totalOrders, color: "bg-warning/10 text-warning" },
            { icon: Clock, label: "Commission en attente", value: `${totalDue.toLocaleString()} F`, color: "bg-warning/10 text-warning" },
            { icon: DollarSign, label: "Commission payée", value: `${totalPaid.toLocaleString()} F`, color: "bg-success/10 text-success" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className={`inline-flex items-center justify-center h-9 w-9 rounded-lg ${s.color}`}><s.icon className="h-4 w-4" /></div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        ) : links.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Aucun lien pour l'instant</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Choisissez un produit dans la marketplace pour générer votre premier lien.</p>
            <Link to="/marketplace">
              <Button className="gap-2"><Store className="h-4 w-4" />Aller à la marketplace</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-semibold text-foreground">Produit</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Lien</th>
                    <th className="text-left p-4 font-semibold text-foreground">Clics</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden md:table-cell">Commandes</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden md:table-cell">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Non livrées</span>
                    </th>
                    <th className="text-left p-4 font-semibold text-foreground">Commission due</th>
                    <th className="text-left p-4 font-semibold text-foreground hidden lg:table-cell">Payée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {links.map((l) => (
                    <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted overflow-hidden shrink-0">
                            {l.main_image_url ? <img src={l.main_image_url} alt={l.product_name} className="h-full w-full object-cover" /> : <Package className="h-4 w-4 text-muted-foreground/40" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate max-w-[160px]">{l.product_name}</p>
                            <p className="text-xs text-muted-foreground">{l.default_price.toLocaleString()} F</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => copyLink(l.id, l.code)}>
                          {copiedId === l.id ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                          {copiedId === l.id ? "Copié" : "Copier"}
                        </Button>
                      </td>
                      <td className="p-4 text-foreground">{l.clicks}</td>
                      <td className="p-4 text-foreground hidden md:table-cell">{l.orders_count}</td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{l.pending_count}</td>
                      <td className="p-4 font-semibold text-warning">{l.total_due.toLocaleString()} F</td>
                      <td className="p-4 text-success hidden lg:table-cell">{l.total_paid.toLocaleString()} F</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AffiliationPage;
