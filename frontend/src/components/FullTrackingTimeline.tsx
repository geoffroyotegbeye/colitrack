import { CheckCircle2, Circle, Package, ShoppingCart, Warehouse, Plane, MapPin, Truck, HandCoins } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { OrderStatus } from "@/lib/types";

const ALL_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "registered", label: "Commande enregistrée", icon: Package },
  { status: "validated", label: "Commande confirmée", icon: CheckCircle2 },
  { status: "purchased", label: "Produit acheté chez le fournisseur", icon: ShoppingCart },
  { status: "in_china", label: "Colis reçu à l'entrepôt en Chine", icon: Warehouse },
  { status: "shipped", label: "Expédié depuis la Chine", icon: Plane },
  { status: "in_transit", label: "En transit vers le Bénin", icon: Plane },
  { status: "arrived_benin", label: "Arrivé au Bénin", icon: MapPin },
  { status: "delivering", label: "Disponible pour retrait / en livraison", icon: Truck },
  { status: "delivered", label: "Colis livré", icon: HandCoins },
];

interface TrackingEvent {
  status: OrderStatus;
  description: string;
  timestamp: string;
}

interface FullTrackingTimelineProps {
  currentStatus: OrderStatus;
  events: TrackingEvent[];
}

export function FullTrackingTimeline({ currentStatus, events }: FullTrackingTimelineProps) {
  // Find the index of the current status
  const currentIndex = ALL_STEPS.findIndex((s) => s.status === currentStatus);

  // Build a map of events by status for dates
  const eventMap = new Map<string, TrackingEvent>();
  for (const evt of events) {
    if (!eventMap.has(evt.status) || new Date(evt.timestamp) > new Date(eventMap.get(evt.status)!.timestamp)) {
      eventMap.set(evt.status, evt);
    }
  }

  // If refused, show special
  if (currentStatus === "refused") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
        <Circle className="h-5 w-5 text-destructive" />
        <div>
          <p className="text-sm font-semibold text-destructive">Commande refusée</p>
          {eventMap.has("refused") && (
            <p className="text-xs text-muted-foreground">{eventMap.get("refused")!.description}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {ALL_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;
        const event = eventMap.get(step.status);
        const StepIcon = step.icon;

        return (
          <div key={step.status} className="flex gap-4">
            {/* Vertical line + icon */}
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center h-9 w-9 rounded-full shrink-0 transition-all ${
                  isCurrent
                    ? "bg-accent text-accent-foreground ring-4 ring-accent/20"
                    : isCompleted
                    ? "bg-accent/80 text-accent-foreground"
                    : "bg-muted text-muted-foreground/40"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>
              {index < ALL_STEPS.length - 1 && (
                <div
                  className={`w-0.5 flex-1 min-h-[2rem] ${
                    isCompleted ? "bg-accent/60" : "bg-border"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-5 pt-1">
              <p
                className={`text-sm font-semibold ${
                  isCurrent
                    ? "text-accent"
                    : isCompleted
                    ? "text-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                {step.label}
                {isCurrent && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/20 text-accent">
                    EN COURS
                  </span>
                )}
              </p>
              {event && (
                <>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {format(new Date(event.timestamp), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                </>
              )}
              {isPending && !event && (
                <p className="text-xs text-muted-foreground/40 mt-0.5">En attente</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
