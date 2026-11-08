import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Package, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const NotFound = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-8">
        <Link to="/tracking" className="inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-accent">
            <Package className="h-6 w-6 text-accent-foreground" />
          </div>
          <span className="text-2xl font-bold font-heading text-foreground">ColiTrack</span>
        </Link>

        <div className="bg-card rounded-xl border border-border shadow-card p-8 space-y-4">
          <p className="text-6xl font-bold font-heading text-accent">404</p>
          <div>
            <h1 className="text-xl font-bold font-heading text-foreground">Page introuvable</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              La page que vous cherchez n'existe pas ou a été déplacée.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />Retour
            </Button>
            <Link to={user ? "/dashboard" : "/tracking"} className="flex-1">
              <Button className="w-full gap-2 gradient-accent text-accent-foreground hover:opacity-90">
                <Home className="h-4 w-4" />{user ? "Tableau de bord" : "Accueil"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
