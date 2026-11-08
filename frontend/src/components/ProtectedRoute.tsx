import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function AuthLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
    </div>
  );
}

/**
 * Garde par liste blanche : toutes les routes du back-office sont regroupées sous
 * <Route element={<RequireAuth />}>. Une route non listée comme publique est donc
 * protégée par défaut — on ne peut pas en oublier une. Sans connexion → redirection
 * vers /login, avec mémorisation de la page demandée pour y revenir après connexion.
 */
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Garde pour une seule route (conservée pour compatibilité). */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
