import { Link } from "react-router-dom";
import { Package } from "lucide-react";

const ResetPasswordPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <div className="w-full max-w-md text-center space-y-6">
      <Link to="/tracking" className="inline-flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-accent">
          <Package className="h-6 w-6 text-accent-foreground" />
        </div>
        <span className="text-2xl font-bold font-heading text-foreground">ColiTrack</span>
      </Link>
      <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
        <h1 className="text-xl font-bold font-heading text-foreground">Réinitialisation</h1>
        <p className="text-muted-foreground text-sm">Contactez l'administrateur pour réinitialiser votre mot de passe.</p>
        <Link to="/login" className="block text-accent hover:underline text-sm">← Retour à la connexion</Link>
      </div>
    </div>
  </div>
);

export default ResetPasswordPage;
