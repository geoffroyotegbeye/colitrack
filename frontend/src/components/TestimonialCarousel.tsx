import { useEffect, useRef } from "react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Star, Shirt, Headphones as HeadphonesIcon, Watch, Smartphone, Backpack } from "lucide-react";

interface Testimonial {
  name: string;
  city: string;
  rating: number;
  quote: string;
  product: string;
  icon: typeof Shirt;
}

// Avis d'exemple — à remplacer par de vrais retours clients une fois collectés.
const TESTIMONIALS: Testimonial[] = [
  { name: "Aminata", city: "Cotonou, Bénin", rating: 5, quote: "Suivi impeccable, j'ai reçu mon colis plus tôt que prévu. Je recommande !", product: "Robe de soirée", icon: Shirt },
  { name: "Kwabena", city: "Accra, Ghana", rating: 5, quote: "Le vendeur était réactif et le suivi en temps réel m'a rassuré du début à la fin.", product: "Écouteurs sans fil", icon: HeadphonesIcon },
  { name: "Fatou", city: "Dakar, Sénégal", rating: 4, quote: "Bonne expérience globale, la livraison a pris un peu plus de temps que l'estimation.", product: "Montre connectée", icon: Watch },
  { name: "Yao", city: "Abidjan, Côte d'Ivoire", rating: 5, quote: "Deuxième commande chez ColiTrack, toujours aussi fiable. Merci !", product: "Smartphone", icon: Smartphone },
  { name: "Adaeze", city: "Lagos, Nigeria", rating: 5, quote: "J'ai pu suivre chaque étape depuis la Chine jusqu'à ma porte. Très rassurant.", product: "Sac à dos", icon: Backpack },
  { name: "Moussa", city: "Bamako, Mali", rating: 4, quote: "Service client à l'écoute, ils ont répondu rapidement à toutes mes questions.", product: "Vêtements", icon: Shirt },
];

export function TestimonialCarousel() {
  const apiRef = useRef<CarouselApi | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    stop();
    timerRef.current = setInterval(() => apiRef.current?.scrollNext(), 4000);
  };
  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div onMouseEnter={stop} onMouseLeave={start}>
      <Carousel opts={{ loop: true, align: "start" }} setApi={(api) => (apiRef.current = api)}>
        <CarouselContent>
          {TESTIMONIALS.map((t, i) => (
            <CarouselItem key={i} className="basis-full sm:basis-1/2 lg:basis-1/3">
              <div className="bg-card rounded-2xl border border-border shadow-card p-6 h-full flex flex-col gap-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className={`h-3.5 w-3.5 ${s < t.rating ? "fill-warning text-warning" : "text-muted-foreground/20"}`} />
                  ))}
                </div>
                <p className="text-sm text-foreground flex-1">"{t.quote}"</p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-accent text-xs font-bold text-accent-foreground shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground shrink-0" title={t.product}>
                    <t.icon className="h-3.5 w-3.5" />
                    <span className="text-[11px] max-w-[80px] truncate">{t.product}</span>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
