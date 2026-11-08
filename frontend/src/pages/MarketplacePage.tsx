import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Produit } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { toast } from "sonner";
import { Package, Search, ShoppingBag, Tag, ShoppingCart } from "lucide-react";

const ALL = "all";
type SortKey = "recent" | "price_asc" | "price_desc" | "popular";

const MarketplacePage = () => {
  const { user } = useAuth();
  const { count, addItem } = useCart();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [sort, setSort] = useState<SortKey>("recent");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["marketplace-products"],
    queryFn: () => api.produits.marketplace(),
  });

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[],
    [products]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (category !== ALL) list = list.filter((p) => p.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sort === "price_asc") return a.default_price - b.default_price;
      if (sort === "price_desc") return b.default_price - a.default_price;
      if (sort === "popular") return b.usage_count - a.usage_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [products, category, search, sort]);

  const addToCart = (p: Produit) => {
    const deliveryMode = p.transport_options[0]?.mode || "standard";
    addItem({ productId: p.id, name: p.name, price: p.default_price, image: p.main_image_url, weight: p.weight || 0, productLink: p.product_link, deliveryMode });
    toast.success(`"${p.name}" ajouté au panier`);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-primary border-b border-primary-foreground/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/tracking" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <Package className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-lg font-bold font-heading text-primary-foreground">ColiTrack</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/panier" className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors" title="Panier">
              <ShoppingCart className="h-4 w-4 text-primary-foreground" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>
            {user ? (
              <Link to="/dashboard" className="text-sm text-primary-foreground/70 hover:text-primary-foreground">
                Tableau de bord →
              </Link>
            ) : (
              <Link to="/login" className="text-sm text-primary-foreground/70 hover:text-primary-foreground">
                Connexion →
              </Link>
            )}
          </div>
        </div>
      </nav>

      <section className="bg-primary py-6">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-1">Marketplace</p>
          <h1 className="text-xl lg:text-2xl font-bold font-heading text-primary-foreground mb-1">
            Commandez depuis notre catalogue
          </h1>
          <p className="text-primary-foreground/60 max-w-lg text-sm">
            Parcourez le catalogue et commandez directement. Vous pouvez aussi générer un lien d'affiliation sur la fiche d'un produit pour le revendre et gagner une commission.
          </p>
        </div>
      </section>

      <div className="border-b border-border bg-card sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit..."
              className="pl-11 h-10"
            />
          </div>
          <CategoryCombobox
            categories={categories}
            value={category}
            onChange={setCategory}
            allValue={ALL}
            className="sm:w-48 shrink-0"
          />
          <select
            value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-10 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground shrink-0"
          >
            <option value="recent">Plus récents</option>
            <option value="popular">Plus commandés</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Aucun produit trouvé</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} produit(s)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p) => (
                <div key={p.id} className="group bg-card rounded-xl border border-border overflow-hidden flex flex-col hover:border-accent/40 transition-colors">
                  <Link to={`/produit/${p.id}`} className="h-32 bg-muted flex items-center justify-center overflow-hidden">
                    {p.main_image_url ? (
                      <img src={p.main_image_url} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </Link>
                  <div className="p-3 space-y-1.5 flex-1 flex flex-col">
                    {p.category && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <Tag className="h-2.5 w-2.5" />{p.category}
                      </span>
                    )}
                    <Link to={`/produit/${p.id}`} className="text-sm font-medium text-foreground leading-tight line-clamp-2 group-hover:text-accent transition-colors">
                      {p.name}
                    </Link>
                    <p className="text-base font-bold text-accent">{p.default_price.toLocaleString()} F</p>
                    {p.usage_count > 0 && <p className="text-[11px] text-muted-foreground">{p.usage_count} commande(s)</p>}
                    <div className="mt-auto pt-2">
                      <Button size="sm" onClick={() => addToCart(p)} className="w-full gap-1.5 text-xs h-8 bg-accent text-accent-foreground hover:bg-accent/90">
                        <ShoppingCart className="h-3 w-3" />Ajouter au panier
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent"><Package className="h-4 w-4 text-accent-foreground" /></div>
            <span className="font-bold font-heading">ColiTrack</span>
          </div>
          <p className="text-xs text-primary-foreground/40">© {new Date().getFullYear()} ColiTrack</p>
        </div>
      </footer>
    </div>
  );
};

export default MarketplacePage;
