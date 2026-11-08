import { CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface GenericEvent {
  id: string;
  status: string;
  description: string;
  timestamp: string;
  changedByName?: string | null;
}

interface TrackingTimelineProps {
  events: GenericEvent[];
  labels: Record<string, string>;
}

export function TrackingTimeline({ events, labels }: TrackingTimelineProps) {
  const sorted = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-0">
      {sorted.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            {index === 0 ? (
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
            )}
            {index < sorted.length - 1 && (
              <div className="w-0.5 flex-1 bg-border min-h-[2rem]" />
            )}
          </div>
          <div className="pb-6">
            <p className={`text-sm font-semibold ${index === 0 ? "text-foreground" : "text-muted-foreground"}`}>
              {labels[event.status] || event.status}
            </p>
            <p className="text-xs text-muted-foreground">{event.description}</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {format(new Date(event.timestamp), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
              {event.changedByName && <> · par {event.changedByName}</>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
