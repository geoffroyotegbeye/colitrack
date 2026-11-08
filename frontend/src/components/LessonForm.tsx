import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2 } from "lucide-react";
import type { Lesson, QuizQuestion } from "@/lib/api";

const emptyQuestion = (): QuizQuestion => ({ question: "", options: ["", "", "", ""], correct_index: 0 });

interface Props {
  initial?: Lesson;
  onSubmit: (data: { title: string; type: "video" | "pdf" | "quiz"; content_url?: string; quiz_data?: QuizQuestion[] }) => void;
  pending: boolean;
}

export function LessonForm({ initial, onSubmit, pending }: Props) {
  const [title, setTitle] = useState(initial?.title || "");
  const [type, setType] = useState<"video" | "pdf" | "quiz">(initial?.type || "video");
  const [contentUrl, setContentUrl] = useState(initial?.content_url || "");
  const [questions, setQuestions] = useState<QuizQuestion[]>(initial?.quiz_data?.length ? initial.quiz_data : [emptyQuestion()]);

  const updateQuestion = (i: number, patch: Partial<QuizQuestion>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const updateOption = (qi: number, oi: number, value: string) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) } : q)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "quiz") {
      onSubmit({ title, type, quiz_data: questions.filter((q) => q.question.trim()) });
    } else {
      onSubmit({ title, type, content_url: contentUrl });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      <div className="space-y-2"><Label>Titre de la leçon *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="video">Vidéo</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="quiz">Quiz</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type !== "quiz" ? (
        <div className="space-y-2">
          <Label>{type === "video" ? "URL vidéo (embed)" : "URL du PDF"}</Label>
          <Input value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} placeholder="https://..." required />
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <div key={qi} className="border border-border rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Input value={q.question} onChange={(e) => updateQuestion(qi, { question: e.target.value })} placeholder={`Question ${qi + 1}`} className="flex-1" />
                {questions.length > 1 && (
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <RadioGroup value={String(q.correct_index)} onValueChange={(v) => updateQuestion(qi, { correct_index: Number(v) })} className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <RadioGroupItem value={String(oi)} id={`q${qi}-o${oi}`} />
                    <Input value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="flex-1 h-9" />
                  </div>
                ))}
              </RadioGroup>
              <p className="text-[11px] text-muted-foreground">Sélectionnez la bonne réponse via le bouton radio.</p>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}>
            <Plus className="h-3.5 w-3.5" />Ajouter une question
          </Button>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={pending || !title.trim()}>
        {pending ? "Enregistrement..." : initial ? "Enregistrer" : "Ajouter la leçon"}
      </Button>
    </form>
  );
}
