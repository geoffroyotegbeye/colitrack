import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, saveUser, isRemembered } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { User, KeyRound, Save } from "lucide-react";

const ProfilePage = () => {
  const { user, signIn } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.auth.me(),
    enabled: !!user,
  });

  useEffect(() => {
    if (me) {
      setFullName(me.full_name);
      setPhone(me.phone || "");
    }
  }, [me]);

  const updateInfo = useMutation({
    mutationFn: () => api.auth.updateMe({ full_name: fullName, phone }),
    onSuccess: (updated) => {
      saveUser(updated, isRemembered());
      signIn(updated);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profil mis à jour");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updatePassword = useMutation({
    mutationFn: () => {
      if (newPassword !== confirmPassword) throw new Error("Les mots de passe ne correspondent pas");
      return api.auth.updateMe({ current_password: currentPassword, new_password: newPassword });
    },
    onSuccess: () => {
      toast.success("Mot de passe mis à jour");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Mon profil</h1>
          <p className="text-muted-foreground mt-1">Gérez vos informations personnelles et votre mot de passe</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><User className="h-5 w-5 text-accent" /></div>
              <h2 className="font-semibold text-foreground">Informations personnelles</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); updateInfo.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={me?.email || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <PhoneInput value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Button type="submit" disabled={updateInfo.isPending} className="gap-2">
                <Save className="h-4 w-4" />{updateInfo.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </form>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><KeyRound className="h-5 w-5 text-accent" /></div>
              <h2 className="font-semibold text-foreground">Changer le mot de passe</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); updatePassword.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Mot de passe actuel</Label>
                <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>Confirmer le nouveau mot de passe</Label>
                <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" disabled={updatePassword.isPending} className="gap-2">
                <Save className="h-4 w-4" />{updatePassword.isPending ? "Enregistrement..." : "Changer le mot de passe"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
