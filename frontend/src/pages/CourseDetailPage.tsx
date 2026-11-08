import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Lesson } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { LessonForm } from "@/components/LessonForm";
import { QuizPlayer } from "@/components/QuizPlayer";
import { printCertificate } from "@/lib/printCertificate";
import {
  ArrowLeft, Plus, Trash2, PlayCircle, FileText, HelpCircle, CheckCircle2,
  Circle, Award, Printer, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const TYPE_ICONS = { video: PlayCircle, pdf: FileText, quiz: HelpCircle };

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => api.courses.get(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (course && course.lessons.length > 0 && !activeLessonId) {
      setActiveLessonId(course.lessons[0].id);
    }
  }, [course, activeLessonId]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["course", id] });

  const addLesson = useMutation({
    mutationFn: (d: Parameters<typeof api.courses.addLesson>[1]) => api.courses.addLesson(id!, d),
    onSuccess: () => { toast.success("Leçon ajoutée"); invalidate(); setAddLessonOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateLesson = useMutation({
    mutationFn: ({ lessonId, d }: { lessonId: string; d: Parameters<typeof api.courses.updateLesson>[1] }) => api.courses.updateLesson(lessonId, d),
    onSuccess: () => { toast.success("Leçon modifiée"); invalidate(); setEditingLesson(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteLesson = useMutation({
    mutationFn: (lessonId: string) => api.courses.deleteLesson(lessonId),
    onSuccess: () => { toast.success("Leçon supprimée"); invalidate(); setDeletingLesson(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteCourse = useMutation({
    mutationFn: () => api.courses.delete(id!),
    onSuccess: () => { toast.success("Cours supprimé"); navigate("/formation"); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: () => api.courses.update(id!, { status: course!.status === "published" ? "draft" : "published" }),
    onSuccess: () => { toast.success(course!.status === "published" ? "Cours repassé en brouillon" : "Cours publié"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const completeLesson = useMutation({
    mutationFn: ({ lessonId, score }: { lessonId: string; score?: number }) => api.courses.completeLesson(id!, lessonId, score),
    onSuccess: (res) => {
      invalidate();
      if (res.certified) toast.success("Cours terminé ! Certificat débloqué 🎉");
      else toast.success("Leçon marquée comme terminée");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Cours introuvable.</p>
      </DashboardLayout>
    );
  }

  const activeLesson = course.lessons.find((l) => l.id === activeLessonId) || null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/formation" className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold font-heading text-foreground truncate">{course.title}</h1>
            {course.description && <p className="text-muted-foreground mt-1 text-sm">{course.description}</p>}
          </div>
          {isAdmin && (
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => toggleStatus.mutate()} disabled={toggleStatus.isPending}>
              {course.status === "published" ? "Repasser en brouillon" : "Publier"}
            </Button>
          )}
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce cours ?</AlertDialogTitle>
                  <AlertDialogDescription>Toutes les leçons et progressions associées seront supprimées. Action irréversible.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteCourse.mutate()}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {course.certified && (
          <div className="bg-warning/10 rounded-xl border border-warning/30 p-5 flex items-center gap-4 flex-wrap">
            <Award className="h-10 w-10 text-warning shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">Cours terminé — certificat obtenu !</p>
              <p className="text-sm text-muted-foreground">Félicitations, vous avez complété toutes les leçons.</p>
            </div>
            <Button variant="outline" className="gap-2 shrink-0" onClick={() => printCertificate(course.title, user?.full_name || "Utilisateur")}>
              <Printer className="h-4 w-4" />Imprimer le certificat
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lessons sidebar */}
          <div className="bg-card rounded-xl border border-border shadow-card p-4 space-y-2 lg:order-1 order-2">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-semibold text-foreground text-sm">Leçons ({course.lessons.length})</h2>
              {isAdmin && (
                <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7"><Plus className="h-4 w-4" /></Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Nouvelle leçon</DialogTitle></DialogHeader>
                    <LessonForm onSubmit={(d) => addLesson.mutate(d)} pending={addLesson.isPending} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {course.lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Aucune leçon pour l'instant.</p>
            ) : (
              <div className="space-y-1">
                {course.lessons.map((l) => {
                  const Icon = TYPE_ICONS[l.type];
                  const done = !!l.completed_at;
                  return (
                    <div key={l.id} className={cn("flex items-center gap-2 rounded-lg px-2 py-2 group", activeLessonId === l.id ? "bg-accent/10" : "hover:bg-muted/50")}>
                      <button onClick={() => setActiveLessonId(l.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                        {done ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className={cn("text-sm truncate", activeLessonId === l.id ? "text-foreground font-medium" : "text-muted-foreground")}>{l.title}</span>
                      </button>
                      {isAdmin && (
                        <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingLesson(l)}><Pencil className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setDeletingLesson(l)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="lg:col-span-2 space-y-4 lg:order-2 order-1">
            {!activeLesson ? (
              <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center text-muted-foreground">
                {isAdmin ? "Ajoutez une leçon pour commencer." : "Ce cours n'a pas encore de contenu."}
              </div>
            ) : isAdmin ? (
              <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-3">
                <h2 className="font-heading font-semibold text-foreground">{activeLesson.title}</h2>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{activeLesson.type}</p>
                {activeLesson.type !== "quiz" ? (
                  <p className="text-sm text-accent break-all">{activeLesson.content_url}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">{activeLesson.quiz_data?.length || 0} question(s)</p>
                )}
              </div>
            ) : (
              <>
                <h2 className="font-heading font-semibold text-foreground text-lg">{activeLesson.title}</h2>
                {activeLesson.type === "video" && (
                  <div className="space-y-3">
                    <iframe src={activeLesson.content_url || ""} className="w-full aspect-video rounded-xl border border-border" allowFullScreen title={activeLesson.title} />
                    <LessonCompleteButton lesson={activeLesson} onComplete={() => completeLesson.mutate({ lessonId: activeLesson.id })} pending={completeLesson.isPending} />
                  </div>
                )}
                {activeLesson.type === "pdf" && (
                  <div className="space-y-3">
                    <iframe src={activeLesson.content_url || ""} className="w-full h-[600px] rounded-xl border border-border" title={activeLesson.title} />
                    <LessonCompleteButton lesson={activeLesson} onComplete={() => completeLesson.mutate({ lessonId: activeLesson.id })} pending={completeLesson.isPending} />
                  </div>
                )}
                {activeLesson.type === "quiz" && (
                  <QuizPlayer
                    questions={activeLesson.quiz_data || []}
                    previousScore={activeLesson.quiz_score}
                    pending={completeLesson.isPending}
                    onComplete={(score) => completeLesson.mutate({ lessonId: activeLesson.id, score })}
                  />
                )}
              </>
            )}
          </div>
        </div>

        <Dialog open={!!editingLesson} onOpenChange={(o) => { if (!o) setEditingLesson(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Modifier la leçon</DialogTitle></DialogHeader>
            {editingLesson && (
              <LessonForm
                initial={editingLesson}
                pending={updateLesson.isPending}
                onSubmit={(d) => updateLesson.mutate({ lessonId: editingLesson.id, d })}
              />
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!deletingLesson}
          onOpenChange={(o) => { if (!o) setDeletingLesson(null); }}
          title={`Supprimer "${deletingLesson?.title}" ?`}
          description="La progression des apprenants sur cette leçon sera perdue. Action irréversible."
          pending={deleteLesson.isPending}
          onConfirm={() => deletingLesson && deleteLesson.mutate(deletingLesson.id)}
        />
      </div>
    </DashboardLayout>
  );
};

function LessonCompleteButton({ lesson, onComplete, pending }: { lesson: Lesson; onComplete: () => void; pending: boolean }) {
  if (lesson.completed_at) {
    return <div className="flex items-center gap-2 text-sm text-success font-medium"><CheckCircle2 className="h-4 w-4" />Terminé</div>;
  }
  return <Button onClick={onComplete} disabled={pending} className="gap-2"><CheckCircle2 className="h-4 w-4" />{pending ? "..." : "Marquer comme terminé"}</Button>;
}

export default CourseDetailPage;
