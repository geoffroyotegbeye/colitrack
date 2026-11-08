import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Commande } from "@/lib/api";
import { DELIVERY_MODES } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
  order: Commande;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditOrderDialog({ order, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    client_name: "", client_phone: "", city: "", product: "",
    quantity: 1, price: 0, tax: 0, weight: 0,
    product_link: "", delivery_mode: "standard", estimated_arrival: "", notes: "",
  });

  useEffect(() => {
    if (open && order) {
      setForm({
        client_name: order.client_name,
        client_phone: order.client_phone,
        city: order.city,
        product: order.product,
        quantity: order.quantity,
        price: Number(order.price),
        tax: Number(order.tax ?? 0),
        weight: Number(order.weight),
        product_link: order.product_link || "",
        delivery_mode: order.delivery_mode,
        estimated_arrival: order.estimated_arrival || "",
        notes: order.notes || "",
      });
    }
  }, [open, order]);

  const updateOrder = useMutation({
    mutationFn: () => api.commandes.update(order.id, {
      client_name: form.client_name.trim(),
      client_phone: form.client_phone.trim(),
      city: form.city.trim(),
      product: form.product.trim(),
      quantity: form.quantity,
      price: form.price,
      tax: form.tax,
      weight: form.weight,
      product_link: form.product_link.trim() || undefined,
      delivery_mode: form.delivery_mode,
      estimated_arrival: form.estimated_arrival || undefined,
      notes: form.notes.trim() || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commande", order.id] });
      toast.success("Commande modifiée !");
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const set = (key: string, value: string | number) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Modifier la commande</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nom client</Label><Input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} /></div>
            <div className="space-y-2"><Label>Téléphone</Label><PhoneInput value={form.client_phone} onChange={(e) => set("client_phone", e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Ville</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
          <div className="space-y-2"><Label>Produit</Label><Input value={form.product} onChange={(e) => set("product", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Quantité</Label><Input type="number" min={1} value={form.quantity} onChange={(e) => set("quantity", parseInt(e.target.value) || 1)} /></div>
            <div className="space-y-2"><Label>Prix (FCFA)</Label><Input type="number" min={0} value={form.price} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} /></div>
            <div className="space-y-2"><Label>Taxe (FCFA)</Label><Input type="number" min={0} value={form.tax} onChange={(e) => set("tax", parseFloat(e.target.value) || 0)} /></div>
            <div className="space-y-2"><Label>Poids (kg)</Label><Input type="number" min={0} step={0.1} value={form.weight} onChange={(e) => set("weight", parseFloat(e.target.value) || 0)} /></div>
          </div>
          <div className="space-y-2"><Label>Date d'arrivée estimée</Label><Input type="date" value={form.estimated_arrival} onChange={(e) => set("estimated_arrival", e.target.value)} /></div>
          <div className="space-y-2"><Label>Lien produit</Label><Input value={form.product_link} onChange={(e) => set("product_link", e.target.value)} placeholder="https://..." /></div>
          <div className="space-y-2">
            <Label>Mode de livraison</Label>
            <Select value={form.delivery_mode} onValueChange={(v) => set("delivery_mode", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(DELIVERY_MODES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => updateOrder.mutate()} disabled={updateOrder.isPending}>
            {updateOrder.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
