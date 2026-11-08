import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function StickyInstallButton() {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstalled || dismissed) return;
    const wasDismissed = sessionStorage.getItem("sticky-install-dismissed");
    if (wasDismissed) { setDismissed(true); return; }
    
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isInstalled, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("sticky-install-dismissed", "1");
  };

  if (!visible || isInstalled || dismissed || (!canInstall && !isIOS)) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[80] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="relative">
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground z-10"
        >
          <X className="h-3 w-3" />
        </button>
        <button
          onClick={install}
          className="flex items-center gap-2 bg-accent text-accent-foreground px-5 py-3 rounded-full shadow-lg hover:bg-accent/90 transition-all font-semibold text-sm hover:scale-105 active:scale-95"
        >
          <Download className="h-4 w-4" />
          Installer l'app
        </button>
      </div>
    </div>
  );
}
