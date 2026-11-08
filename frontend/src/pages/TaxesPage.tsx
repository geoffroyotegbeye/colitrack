import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type TransportOption } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { DELIVERY_MODES } from "@/lib/types";
import { Percent, Save, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

const TaxesPage = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [rate, setRate] = useState("0");
  const [commissionRate, setCommissionRate] = useState("10");
  const [rates, setRates] = useState<TransportOption[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["tax-rate"],
    queryFn: () => api.taxes.getRate(),
  });

  const { data: transportRates, isLoading: isLoadingTransport } = useQuery({
    queryKey: ["transport-rates"],
    queryFn: () => api.taxes.getTransportRates(),
  });

  useEffect(() => {
    if (data) {
      setRate(String(data.rate));
      setCommissionRate(String(data.default_commission_rate));
    }
  }, [data]);

  useEffect(() => {
    if (transportRates) setRates(transportRates);
  }, [transportRates]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tax-rate"] });

  const updateTaxRate = useMutation({
    mutationFn: () => api.taxes.setRate({ rate: parseFloat(rate) || 0 }),
    onSuccess: () => { toast.success("Taux de taxe mis à jour"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateCommissionRate = useMutation({
    mutationFn: () => api.taxes.setRate({ default_commission_rate: parseFloat(commissionRate) || 0 }),
    onSuccess: () => { toast.success("Taux de commission par défaut mis à jour"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateTransportRates = useMutation({
    mutationFn: () => api.taxes.setTransportRates(rates),
    onSuccess: () => {
      toast.success("Tarifs de transport mis à jour");
      queryClient.invalidateQueries({ queryKey: ["transport-rates"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setRateField = (mode: string, field: keyof TransportOption, value: string) =>
    setRates((prev) => prev.map((r) => (r.mode === mode ? { ...r, [field]: Number(value) || 0 } : r)));

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Taxes &amp; Commission</h1>
          <p className="text-muted-foreground mt-1">Taux par défaut appliqués aux commandes et aux produits du catalogue</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><Percent className="h-5 w-5 text-accent" /></div>
                <div>
                  <h2 className="font-semibold text-foreground">Taux de taxe</h2>
                  <p className="text-sm text-muted-foreground">Ex: 5 signifie 5% du prix de la commande</p>
                </div>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); updateTaxRate.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rate">Taux (%)</Label>
                  <Input id="rate" type="number" min={0} max={100} step={0.1} value={rate} onChange={(e) => setRate(e.target.value)} />
                </div>
                <Button type="submit" disabled={updateTaxRate.isPending} className="gap-2">
                  <Save className="h-4 w-4" />{updateTaxRate.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground border-t border-border pt-4">
                Ce taux est appliqué automatiquement au moment de la création de chaque commande (saisie manuelle, message collé, ou commande depuis une boutique publique). Le montant peut ensuite être corrigé manuellement sur une commande précise depuis sa fiche détail.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><ShoppingBag className="h-5 w-5 text-accent" /></div>
                <div>
                  <h2 className="font-semibold text-foreground">Commission par défaut</h2>
                  <p className="text-sm text-muted-foreground">Utilisé quand un produit n'a pas de commission propre</p>
                </div>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); updateCommissionRate.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="commission-rate">Taux (%)</Label>
                  <Input id="commission-rate" type="number" min={0} max={100} step={0.1} value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} />
                </div>
                <Button type="submit" disabled={updateCommissionRate.isPending} className="gap-2">
                  <Save className="h-4 w-4" />{updateCommissionRate.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground border-t border-border pt-4">
                Chaque produit peut définir son propre taux de commission dans le catalogue ; s'il est laissé vide, ce taux par défaut s'applique. La commission est versée à l'agent une fois la commande livrée.
              </p>
            </div>
          </div>
        )}

        {isLoadingTransport ? null : (
          <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><Truck className="h-5 w-5 text-accent" /></div>
              <div>
                <h2 className="font-semibold text-foreground">Tarifs de transport</h2>
                <p className="text-sm text-muted-foreground">Prix par kg et délai estimé, par mode de transport — appliqués automatiquement selon le mode choisi sur un produit</p>
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); updateTransportRates.mutate(); }} className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground text-xs">
                      <th className="font-medium pb-2">Mode</th>
                      <th className="font-medium pb-2">Tarif (FCFA/kg)</th>
                      <th className="font-medium pb-2">Délai min (jours)</th>
                      <th className="font-medium pb-2">Délai max (jours)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((r) => (
                      <tr key={r.mode}>
                        <td className="py-1.5 pr-3 font-medium text-foreground">{DELIVERY_MODES[r.mode] || r.mode}</td>
                        <td className="py-1.5 pr-3">
                          <Input type="number" min={0} step={0.01} value={r.rate_per_kg} onChange={(e) => setRateField(r.mode, "rate_per_kg", e.target.value)} className="h-9 w-28" />
                        </td>
                        <td className="py-1.5 pr-3">
                          <Input type="number" min={0} value={r.delay_min_days} onChange={(e) => setRateField(r.mode, "delay_min_days", e.target.value)} className="h-9 w-24" />
                        </td>
                        <td className="py-1.5">
                          <Input type="number" min={0} value={r.delay_max_days} onChange={(e) => setRateField(r.mode, "delay_max_days", e.target.value)} className="h-9 w-24" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button type="submit" disabled={updateTransportRates.isPending} className="gap-2">
                <Save className="h-4 w-4" />{updateTransportRates.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TaxesPage;
