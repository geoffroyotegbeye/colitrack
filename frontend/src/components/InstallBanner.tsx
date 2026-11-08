import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share, Monitor, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useIsMobile } from "@/hooks/use-mobile";

export function InstallBanner() {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (isInstalled || dismissed) return;
    const wasDismissed = sessionStorage.getItem("install-banner-dismissed");
    if (wasDismissed) { setDismissed(true); return; }

    const timer = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(timer);
  }, [isInstalled, dismissed]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("install-banner-dismissed", "1");
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    const accepted = await install();
    if (accepted) handleDismiss();
  };

  if (!visible || isInstalled || dismissed) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[90] animate-in slide-in-from-bottom-6 duration-500 p-4">
        <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl shadow-xl p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            {isMobile ? <Smartphone className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-foreground text-sm">Installer ColiTrack</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isMobile ? "Ajoutez l'app sur votre écran d'accueil" : "Installez l'app sur votre ordinateur"}
            </p>
          </div>
          <Button onClick={handleInstall} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shrink-0">
            <Download className="h-4 w-4 mr-1.5" />
            Installer
          </Button>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-foreground text-lg">Installer ColiTrack</h3>
              <button onClick={() => { setShowIOSGuide(false); handleDismiss(); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-xs">1</span>
                <p>Appuyez sur <Share className="inline h-4 w-4 text-accent" /> <strong className="text-foreground">Partager</strong> en bas de Safari</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-xs">2</span>
                <p>Faites défiler et appuyez sur <strong className="text-foreground">"Sur l'écran d'accueil"</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-xs">3</span>
                <p>Appuyez sur <strong className="text-foreground">"Ajouter"</strong></p>
              </div>
            </div>
            <Button onClick={() => { setShowIOSGuide(false); handleDismiss(); }} className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
              J'ai compris
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
