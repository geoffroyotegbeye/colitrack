import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Produit, type Category } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Package, Plus, Pencil, Trash2, Globe, User, EyeOff, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ImageUpload } from "@/components/ImageUpload";
import { ImageGalleryUpload } from "@/components/ImageGalleryUpload";
import { DELIVERY_MODES } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

const ALL = "all";
const PAGE_SIZE = 8;
const MAX_IMAGES = 7;

type ProductFormState = {
  name: string; description: string; category: string;
  default_quantity: string; default_price: string; product_link: string;
  stock_quantity: string; weight: string; dimensions: string; tax: string; main_image_url: string;
  commission_rate: string; images: string[]; transport_modes: string[];
};

const emptyForm: ProductFormState = {
  name: "", description: "", category: "", default_quantity: "1", default_price: "",
  product_link: "", stock_quantity: "0", weight: "", dimensions: "", tax: "", main_image_url: "",
  commission_rate: "", images: [], transport_modes: [],
};

function toForm(p: Produit): ProductFormState {
  return {
    name: p.name, description: p.description || "", category: p.category || "",
    default_quantity: String(p.default_quantity), default_price: String(p.default_price),
    product_link: p.product_link || "", stock_quantity: String(p.stock_quantity),
    weight: String(p.weight || ""), dimensions: p.dimensions || "", tax: String(p.tax || ""),
    main_image_url: p.main_image_url || "",
    commission_rate: p.commission_rate != null ? String(p.commission_rate) : "",
    images: p.images || [],
    transport_modes: (p.transport_options || []).map((t) => t.mode),
  };
}

function toPayload(f: ProductFormState) {
  return {
    name: f.name, description: f.description || undefined, category: f.category || undefined,
    default_quantity: parseInt(f.default_quantity) || 1, default_price: parseFloat(f.default_price) || 0,
    product_link: f.product_link || undefined, stock_quantity: parseInt(f.stock_quantity) || 0,
    weight: parseFloat(f.weight) || 0, dimensions: f.dimensions || undefined,
    tax: parseFloat(f.tax) || 0, main_image_url: f.main_image_url || undefined,
    commission_rate: f.commission_rate.trim() === "" ? null : parseFloat(f.commission_rate),
    images: f.images,
    transport_modes: f.transport_modes,
  };
}

function ProductForm({ value, onChange, onSubmit, submitLabel, pending, categories, defaultCommissionRate }: {
  value: ProductFormState;
  onChange: (v: ProductFormState) => void;
  onSubmit: () => void;
  submitLabel: string;
  pending: boolean;
  categories: Category[];
  defaultCommissionRate?: number;
}) {
  const set = (k: keyof ProductFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [k]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="space-y-2"><Label>Nom du produit *</Label><Input value={value.name} onChange={set("name")} required /></div>
      <div className="space-y-2"><Label>Description</Label><Textarea value={value.description} onChange={set("description")} rows={2} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Catégorie</Label>
          <Select value={value.category} onValueChange={(v) => onChange({ ...value, category: v })}>
            <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Lien produit</Label><Input value={value.product_link} onChange={set("product_link")} placeholder="https://..." /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Prix (FCFA) *</Label><Input type="number" min="0" value={value.default_price} onChange={set("default_price")} required /></div>
        <div className="space-y-2"><Label>Taxe (FCFA)</Label><Input type="number" min="0" value={value.tax} onChange={set("tax")} /></div>
      </div>
      <div className="space-y-2">
        <Label>Commission agent (%)</Label>
        <Input
          type="number" min={0} max={100} step={0.1} value={value.commission_rate}
          onChange={set("commission_rate")}
          placeholder={defaultCommissionRate !== undefined ? `Défaut : ${defaultCommissionRate}%` : "Défaut"}
        />
        <p className="text-xs text-muted-foreground">Laisser vide pour utiliser le taux par défaut défini dans Taxes &amp; Commission.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Quantité par défaut</Label><Input type="number" min="1" value={value.default_quantity} onChange={set("default_quantity")} /></div>
        <div className="space-y-2"><Label>Stock disponible</Label><Input type="number" min="0" value={value.stock_quantity} onChange={set("stock_quantity")} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Poids (kg)</Label><Input type="number" min="0" step="0.1" value={value.weight} onChange={set("weight")} /></div>
        <div className="space-y-2"><Label>Dimensions</Label><Input value={value.dimensions} onChange={set("dimensions")} placeholder="30x20x10 cm" /></div>
      </div>
      <div className="space-y-2">
        <Label>Modes de transport disponibles</Label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(DELIVERY_MODES).map(([mode, label]) => (
            <label key={mode} className="flex items-center gap-2 text-sm rounded-lg border border-border px-3 py-2 cursor-pointer">
              <Checkbox
                checked={value.transport_modes.includes(mode)}
                onCheckedChange={(checked) => onChange({
                  ...value,
                  transport_modes: checked
                    ? [...value.transport_modes, mode]
                    : value.transport_modes.filter((m) => m !== mode),
                })}
              />
              {label}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Le prix et le délai de chaque mode sont calculés automatiquement depuis les tarifs définis dans Taxes &amp; Commission.</p>
      </div>
      <ImageUpload label="Photo principale" value={value.main_image_url} onChange={(url) => onChange({ ...value, main_image_url: url })} category="produits" />
      <ImageGalleryUpload
        label="Photos supplémentaires"
        values={value.images}
        onChange={(images) => onChange({ ...value, images })}
        category="produits"
        max={MAX_IMAGES - (value.main_image_url ? 1 : 0)}
      />
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Enregistrement..." : submitLabel}</Button>
    </form>
  );
}

function ProductCard({ product, editable, onEdit, onDelete, onToggleStatus }: {
  product: Produit;
  editable: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const hidden = product.status === "hidden";
  return (
    <div className={cn("bg-card rounded-xl border shadow-card overflow-hidden flex flex-col", hidden ? "border-border opacity-60" : "border-border")}>
      <div className="h-36 bg-muted flex items-center justify-center overflow-hidden">
        {product.main_image_url ? (
          <img src={product.main_image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Package className="h-10 w-10 text-muted-foreground/40" />
        )}
      </div>
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-foreground text-sm leading-tight">{product.name}</p>
          {product.is_global ? (
            <Badge variant="secondary" className="gap-1 shrink-0"><Globe className="h-3 w-3" />Global</Badge>
          ) : (
            <Badge variant="outline" className="gap-1 shrink-0"><User className="h-3 w-3" />Perso</Badge>
          )}
        </div>
        {product.category && <p className="text-xs text-muted-foreground">{product.category}</p>}
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-accent">{product.default_price.toLocaleString()} F</span>
          <span className="text-xs text-muted-foreground">Stock: {product.stock_quantity}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Commission : {product.commission_rate != null ? `${product.commission_rate}%` : "taux par défaut"}
        </p>
        {!product.is_global && <p className="text-[11px] text-muted-foreground">Par {product.owner_name}</p>}
        {hidden && <p className="text-[11px] font-medium text-warning">Masqué</p>}
        {editable && (
          <div className="flex items-center gap-1.5 pt-2 mt-auto border-t border-border">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit} title="Modifier"><Pencil className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onToggleStatus} title={hidden ? "Rendre actif" : "Masquer"}>
              <EyeOff className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Supprimer"><Trash2 className="h-3.5 w-3.5" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
                  <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={onDelete}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductRow({ product, editable, onEdit, onDelete, onToggleStatus }: {
  product: Produit;
  editable: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const hidden = product.status === "hidden";
  return (
    <div className={cn("bg-card rounded-xl border shadow-card p-3 flex items-center gap-3", hidden ? "border-border opacity-60" : "border-border")}>
      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {product.main_image_url ? (
          <img src={product.main_image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Package className="h-5 w-5 text-muted-foreground/40" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground text-sm truncate">{product.name}</p>
          {product.is_global ? (
            <Badge variant="secondary" className="gap-1 shrink-0"><Globe className="h-3 w-3" />Global</Badge>
          ) : (
            <Badge variant="outline" className="gap-1 shrink-0"><User className="h-3 w-3" />Perso</Badge>
          )}
          {hidden && <span className="text-[11px] font-medium text-warning shrink-0">Masqué</span>}
        </div>
        <p className="text-xs text-muted-foreground truncate">{product.category || "—"}{!product.is_global && ` · Par ${product.owner_name}`}</p>
      </div>
      <span className="font-bold text-accent text-sm shrink-0">{product.default_price.toLocaleString()} F</span>
      <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">Stock: {product.stock_quantity}</span>
      {editable && (
        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit} title="Modifier"><Pencil className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onToggleStatus} title={hidden ? "Rendre actif" : "Masquer"}>
            <EyeOff className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Supprimer"><Trash2 className="h-3.5 w-3.5" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={onDelete}>Supprimer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

const ProductsPage = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"mine" | "global">(isAdmin ? "global" : "mine");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Produit | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, tab]);

  const filterParams = {
    search: debouncedSearch || undefined,
    status: statusFilter !== ALL ? statusFilter : undefined,
    scope: !isAdmin ? tab : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["produits-page", filterParams, page],
    queryFn: () => api.produits.listPaginated({ ...filterParams, page, limit: PAGE_SIZE }),
  });
  const products = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.list(),
  });

  const { data: taxSettings } = useQuery({
    queryKey: ["tax-rate"],
    queryFn: () => api.taxes.getRate(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["produits-page"] });

  const createProduct = useMutation({
    mutationFn: () => api.produits.create(toPayload(createForm)),
    onSuccess: () => {
      toast.success("Produit créé");
      invalidate();
      setCreateOpen(false);
      setCreateForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Produit> }) => api.produits.update(id, data),
    onSuccess: () => {
      toast.success("Produit mis à jour");
      invalidate();
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.produits.delete(id),
    onSuccess: () => {
      toast.success("Produit supprimé");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Produits</h1>
            <p className="text-muted-foreground mt-1">{total} produit(s)</p>
          </div>
          {isAdmin && (
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setCreateForm(emptyForm); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />Ajouter au catalogue global</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouveau produit global</DialogTitle></DialogHeader>
              <ProductForm value={createForm} onChange={setCreateForm} onSubmit={() => createProduct.mutate()} submitLabel="Créer le produit" pending={createProduct.isPending} categories={categories} defaultCommissionRate={taxSettings?.default_commission_rate} />
            </DialogContent>
          </Dialog>
          )}
        </div>

        {!isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setTab("mine")} className={cn("px-4 py-2 rounded-lg text-sm font-medium", tab === "mine" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>Mon catalogue</button>
            <button onClick={() => setTab("global")} className={cn("px-4 py-2 rounded-lg text-sm font-medium", tab === "global" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>Catalogue global</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Rechercher par nom, catégorie..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-48"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="hidden">Masqué</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1 shrink-0 rounded-lg border border-border p-1">
            <Button size="icon" variant={view === "grid" ? "secondary" : "ghost"} className="h-8 w-8" onClick={() => setView("grid")} title="Vue grille">
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button size="icon" variant={view === "list" ? "secondary" : "ghost"} className="h-8 w-8" onClick={() => setView("list")} title="Vue liste">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        ) : total === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Aucun produit</p>
          </div>
        ) : (
          <>
            <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
              {products.map((p) => {
                const Comp = view === "grid" ? ProductCard : ProductRow;
                return (
                  <Comp
                    key={p.id}
                    product={p}
                    editable={p.user_id === user?.id}
                    onEdit={() => { setEditing(p); setEditForm(toForm(p)); }}
                    onDelete={() => deleteProduct.mutate(p.id)}
                    onToggleStatus={() => updateProduct.mutate({ id: p.id, data: { status: p.status === "hidden" ? "active" : "hidden" } })}
                  />
                );
              })}
            </div>
            <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPageChange={setPage} itemLabel="produit(s)" />
          </>
        )}

        <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Modifier le produit</DialogTitle></DialogHeader>
            {editing && (
              <ProductForm
                value={editForm}
                onChange={setEditForm}
                onSubmit={() => updateProduct.mutate({ id: editing.id, data: toPayload(editForm) })}
                submitLabel="Enregistrer"
                pending={updateProduct.isPending}
                categories={categories}
                defaultCommissionRate={taxSettings?.default_commission_rate}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ProductsPage;
