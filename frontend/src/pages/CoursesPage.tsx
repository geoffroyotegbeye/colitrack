import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Course } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, Plus, Award, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { Link } from "react-router-dom";
import { TablePagination } from "@/components/TablePagination";
import { ImageUpload } from "@/components/ImageUpload";

const emptyForm = { title: "", description: "", thumbnail_url: "", is_free: true, price: "", status: "draft" as "draft" | "published" };
const PAGE_SIZE = 8;

const CoursesPage = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["courses-page", page],
    queryFn: () => api.courses.listPaginated({ page, limit: PAGE_SIZE }),
  });
  const courses = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const createCourse = useMutation({
    mutationFn: () => api.courses.create({
      title: form.title.trim(), description: form.description || undefined, thumbnail_url: form.thumbnail_url || undefined,
      is_free: form.is_free, price: form.is_free ? 0 : parseFloat(form.price) || 0, status: form.status,
    }),
    onSuccess: () => {
      toast.success("Cours créé");
      queryClient.invalidateQueries({ queryKey: ["courses-page"] });
      setCreateOpen(false);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Centre de formation</h1>
            <p className="text-muted-foreground mt-1">{total} cours</p>
          </div>
          {isAdmin && (
            <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setForm(emptyForm); }}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />Nouveau cours</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouveau cours</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); createCourse.mutate(); }} className="space-y-4">
                  <div className="space-y-2"><Label>Titre *</Label><Input value={form.title} onChange={set("title")} required /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={set("description")} rows={3} /></div>
                  <ImageUpload label="Image" value={form.thumbnail_url} onChange={(url) => setForm((p) => ({ ...p, thumbnail_url: url }))} category="courses" />
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <Label className="cursor-pointer">Cours gratuit</Label>
                    <Switch checked={form.is_free} onCheckedChange={(v) => setForm((p) => ({ ...p, is_free: v }))} />
                  </div>
                  {!form.is_free && (
                    <div className="space-y-2"><Label>Prix (FCFA)</Label><Input type="number" min="0" value={form.price} onChange={set("price")} /></div>
                  )}
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as "draft" | "published" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={createCourse.isPending || !form.title.trim()}>
                    {createCourse.isPending ? "Création..." : "Créer le cours"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        ) : total === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Aucun cours {isAdmin ? "" : "disponible pour le moment"}</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => {
              const progress = c.lesson_count > 0 ? Math.round((c.completed_count / c.lesson_count) * 100) : 0;
              return (
                <Link key={c.id} to={`/formation/${c.id}`} className="bg-card rounded-xl border border-border shadow-card overflow-hidden hover:border-accent/40 transition-colors flex flex-col">
                  <div className="h-32 bg-muted flex items-center justify-center overflow-hidden">
                    {c.thumbnail_url ? (
                      <img src={c.thumbnail_url} alt={c.title} className="h-full w-full object-cover" />
                    ) : (
                      <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="p-4 space-y-2 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground text-sm leading-tight">{c.title}</p>
                      {c.certified && <Award className="h-4 w-4 text-warning shrink-0" aria-label="Certifié" />}
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
                    <div className="flex items-center gap-2 mt-auto pt-2">
                      <Badge variant={c.is_free ? "secondary" : "outline"}>{c.is_free ? "Gratuit" : `${c.price.toLocaleString()} F`}</Badge>
                      {isAdmin && <Badge variant={c.status === "published" ? "secondary" : "outline"}>{c.status === "published" ? "Publié" : "Brouillon"}</Badge>}
                      <span className="text-xs text-muted-foreground ml-auto">{c.lesson_count} leçon(s)</span>
                    </div>
                    {!isAdmin && c.lesson_count > 0 && (
                      <div className="space-y-1">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <PlayCircle className="h-3 w-3" />{progress}% terminé
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPageChange={setPage} itemLabel="cours" />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CoursesPage;
