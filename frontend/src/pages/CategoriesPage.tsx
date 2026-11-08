import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Category } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Tag, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { TablePagination } from "@/components/TablePagination";

const PAGE_SIZE = 8;

const CategoriesPage = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["categories-page", page],
    queryFn: () => api.categories.listPaginated({ page, limit: PAGE_SIZE }),
  });
  const categories = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["categories-page"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const createCategory = useMutation({
    mutationFn: () => api.categories.create(newName.trim()),
    onSuccess: () => { toast.success("Catégorie créée"); invalidate(); setNewName(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.categories.update(id, name),
    onSuccess: () => { toast.success("Catégorie renommée"); invalidate(); setEditingId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => api.categories.delete(id),
    onSuccess: () => { toast.success("Catégorie supprimée"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (c: Category) => { setEditingId(c.id); setEditingName(c.name); };

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Catégories</h1>
          <p className="text-muted-foreground mt-1">Catégories de produits utilisées dans le catalogue</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (newName.trim()) createCategory.mutate(); }} className="flex gap-2 max-w-md">
          <Input placeholder="Nouvelle catégorie..." value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button type="submit" disabled={createCategory.isPending || !newName.trim()} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />Ajouter
          </Button>
        </form>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        ) : total === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
            <Tag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Aucune catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {categories.map((c) => (
              <div key={c.id} className="bg-card rounded-xl border border-border shadow-card p-4 space-y-3">
                {editingId === c.id ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); if (editingName.trim()) updateCategory.mutate({ id: c.id, name: editingName.trim() }); }}
                    className="space-y-2"
                  >
                    <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus className="h-9" />
                    <div className="flex items-center gap-1">
                      <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 text-success" disabled={updateCategory.isPending}><Check className="h-4 w-4" /></Button>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/10 text-accent">
                      <Tag className="h-5 w-5" />
                    </div>
                    <p className="font-medium text-foreground text-sm truncate" title={c.name}>{c.name}</p>
                    <div className="flex items-center gap-1 pt-2 border-t border-border">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(c)} title="Renommer"><Pencil className="h-3.5 w-3.5" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Supprimer"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer "{c.name}" ?</AlertDialogTitle>
                            <AlertDialogDescription>Les produits déjà rattachés à cette catégorie garderont l'ancien nom, mais elle disparaîtra du sélecteur.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteCategory.mutate(c.id)}>Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {total > 0 && (
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPageChange={setPage} itemLabel="catégorie(s)" />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CategoriesPage;
