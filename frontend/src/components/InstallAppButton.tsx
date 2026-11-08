import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function InstallAppButton() {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  // iOS: show guide modal
  if (isIOS) {
    return (
      <>
        <Button
          onClick={() => setShowIOSGuide(true)}
          size="sm"
          className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2"
        >
          <Download className="h-4 w-4" />
          Installer l'app
        </Button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-foreground text-lg">Installer ColiTrack</h3>
                <button onClick={() => setShowIOSGuide(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-xs">1</span>
                  <p>Appuyez sur le bouton <Share className="inline h-4 w-4 text-accent" /> <strong className="text-foreground">Partager</strong> en bas de Safari</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-xs">2</span>
                  <p>Faites défiler et appuyez sur <strong className="text-foreground">"Sur l'écran d'accueil"</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-xs">3</span>
                  <p>Appuyez sur <strong className="text-foreground">"Ajouter"</strong> en haut à droite</p>
                </div>
              </div>
              <Button onClick={() => setShowIOSGuide(false)} className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
                J'ai compris
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Android / Desktop: use native prompt
  if (!canInstall) return null;

  return (
    <Button
      onClick={install}
      size="sm"
      className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2"
    >
      <Download className="h-4 w-4" />
      Installer l'app
    </Button>
  );
}
