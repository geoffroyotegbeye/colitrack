import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/api";

interface Props {
  questions: QuizQuestion[];
  onComplete: (scorePercent: number) => void;
  pending: boolean;
  previousScore?: number | null;
}

export function QuizPlayer({ questions, onComplete, pending, previousScore }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(previousScore != null);

  const score = questions.length > 0
    ? Math.round((questions.filter((q, i) => answers[i] === q.correct_index).length / questions.length) * 100)
    : 0;

  const allAnswered = questions.every((_, i) => answers[i] !== undefined);

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete(score);
  };

  if (submitted) {
    const displayScore = previousScore != null && Object.keys(answers).length === 0 ? previousScore : score;
    return (
      <div className="bg-card rounded-xl border border-border shadow-card p-6 text-center space-y-3">
        <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
        <p className="text-lg font-semibold text-foreground">Quiz terminé</p>
        <p className="text-muted-foreground">Score : <span className="font-bold text-foreground">{displayScore}%</span></p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {questions.map((q, qi) => (
        <div key={qi} className="bg-card rounded-xl border border-border shadow-card p-5 space-y-3">
          <p className="font-medium text-foreground">{qi + 1}. {q.question}</p>
          <RadioGroup value={answers[qi] !== undefined ? String(answers[qi]) : undefined} onValueChange={(v) => setAnswers((a) => ({ ...a, [qi]: Number(v) }))}>
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <RadioGroupItem value={String(oi)} id={`quiz-${qi}-${oi}`} />
                <Label htmlFor={`quiz-${qi}-${oi}`} className="font-normal cursor-pointer">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}
      <Button onClick={handleSubmit} disabled={!allAnswered || pending} className="w-full">
        {pending ? "Envoi..." : "Valider le quiz"}
      </Button>
    </div>
  );
}
