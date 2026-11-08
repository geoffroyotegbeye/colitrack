import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Package, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api, saveToken, saveUser } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await api.auth.register(form.full_name, form.email, form.password, form.phone || undefined);
      saveToken(token);
      saveUser(user);
      signIn(user);
      toast.success("Compte créé avec succès !");
      navigate("/dashboard");
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
          <h1 className="text-2xl font-bold font-heading text-foreground">Créer un compte</h1>
          <p className="text-muted-foreground mt-1">Rejoignez ColiTrack pour gérer vos colis</p>
        </div>

        <form onSubmit={handleSignup} className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
          <div className="space-y-2">
            <Label>Nom complet</Label>
            <Input value={form.full_name} onChange={set("full_name")} placeholder="Ex: Amadou Sow" required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={set("email")} placeholder="votre@email.com" required />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <PhoneInput value={form.phone} onChange={set("phone")} placeholder="+229 XX XXX XXX" />
          </div>
          <div className="space-y-2">
            <Label>Mot de passe</Label>
            <PasswordInput value={form.password} onChange={set("password")} placeholder="••••••••" required minLength={6} />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-accent text-accent-foreground hover:opacity-90">
            <UserPlus className="h-4 w-4 mr-2" />
            {loading ? "Création..." : "Créer mon compte"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-accent hover:underline font-medium">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
