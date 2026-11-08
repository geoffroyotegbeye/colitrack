import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Package, LogIn } from "lucide-react";
import { toast } from "sonner";
import { api, saveToken, saveUser } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Checkbox } from "@/components/ui/checkbox";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Page demandée avant d'être redirigé vers /login (sinon tableau de bord)
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || "/dashboard";
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await api.auth.login(email, password);
      saveToken(token, remember);
      saveUser(user, remember);
      signIn(user);
      toast.success("Connexion réussie !");
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/tracking" className="inline-flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-accent">
              <Package className="h-6 w-6 text-accent-foreground" />
            </div>
            <span className="text-2xl font-bold font-heading text-foreground">ColiTrack</span>
          </Link>
          <h1 className="text-2xl font-bold font-heading text-foreground">Connexion</h1>
          <p className="text-muted-foreground mt-1">Accédez à votre espace de gestion</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@colitrack.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Checkbox checked={remember} onCheckedChange={(c) => setRemember(c === true)} />
            Se souvenir de moi
          </label>
          <Button type="submit" disabled={loading} className="w-full gradient-accent text-accent-foreground hover:opacity-90">
            <LogIn className="h-4 w-4 mr-2" />
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link to="/signup" className="text-accent hover:underline font-medium">Créer un compte</Link>
          </p>
          <Link to="/tracking" className="text-sm text-muted-foreground hover:text-foreground">
            ← Suivre un colis
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
