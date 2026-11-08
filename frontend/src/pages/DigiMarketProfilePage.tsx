import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type DigiMarketApplication } from "@/lib/api";
import { ImageUpload } from "@/components/ImageUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { IdCard, MapPin, Briefcase, Phone, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

const emptyForm: DigiMarketApplication = {
  id_card_url: "", id_card_number: "", selfie_url: "",
  country: "", city: "", address: "",
  occupation: "", motivation: "",
  emergency_contact_name: "", emergency_contact_phone: "",
};

const DigiMarketProfilePage = () => {
  const { user, isAgent, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<DigiMarketApplication>(emptyForm);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["digimarket-profile", user?.id],
    enabled: !!user,
    queryFn: () => api.digimarket.getMe(),
  });

  useEffect(() => {
    if (profile) {
      setForm({
        id_card_url: profile.id_card_url || "", id_card_number: profile.id_card_number || "", selfie_url: profile.selfie_url || "",
        country: profile.country || "", city: profile.city || "", address: profile.address || "",
        occupation: profile.occupation || "", motivation: profile.motivation || "",
        emergency_contact_name: profile.emergency_contact_name || "", emergency_contact_phone: profile.emergency_contact_phone || "",
      });
    }
  }, [profile]);

  const set = (k: keyof DigiMarketApplication) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["digimarket-profile", user?.id] });

  const submit = useMutation({
    mutationFn: () => (profile ? api.digimarket.update(form) : api.digimarket.create(form)),
    onSuccess: () => {
      toast.success("Candidature envoyée ! Un admin va l'examiner.");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const complete = Object.values(form).every((v) => v.trim() !== "");

  if (isAdmin) return <Navigate to="/agents" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-heading text-foreground">Devenir agent</h1>
          <p className="text-muted-foreground mt-1">
            Soumettez une candidature complète pour pouvoir générer des liens d'affiliation sur le catalogue. Ces informations permettent à l'admin d'étudier la fiabilité de votre profil.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        ) : isAgent ? (
          <div className="max-w-lg bg-card rounded-xl border border-border shadow-card p-6 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
            <p className="font-semibold text-foreground">Vous êtes agent validé</p>
            <p className="text-sm text-muted-foreground">Vous pouvez générer des liens d'affiliation depuis la Marketplace.</p>
            <Link to="/marketplace">
              <Button variant="outline" className="gap-2">Aller à la Marketplace <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        ) : profile?.status === "pending" ? (
          <div className="max-w-lg bg-card rounded-xl border border-border shadow-card p-6 text-center space-y-3">
            <Clock className="h-10 w-10 text-warning mx-auto" />
            <p className="font-semibold text-foreground">Candidature en attente</p>
            <p className="text-sm text-muted-foreground">Un administrateur va examiner votre dossier prochainement.</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }} className="space-y-6">
            {profile?.status === "rejected" && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                <XCircle className="h-4 w-4 shrink-0" />
                Votre précédente candidature a été rejetée. Vous pouvez en soumettre une nouvelle.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><IdCard className="h-5 w-5 text-accent" /></div>
                  <h2 className="font-semibold text-foreground">Identité</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUpload label="Carte d'identité" value={form.id_card_url} onChange={(v) => setForm((f) => ({ ...f, id_card_url: v }))} category="profile" />
                  <ImageUpload label="Selfie avec la carte d'identité" value={form.selfie_url} onChange={(v) => setForm((f) => ({ ...f, selfie_url: v }))} category="profile" />
                </div>
                <div className="space-y-2">
                  <Label>Numéro de la carte d'identité</Label>
                  <Input value={form.id_card_number} onChange={set("id_card_number")} required />
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><MapPin className="h-5 w-5 text-accent" /></div>
                  <h2 className="font-semibold text-foreground">Adresse</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Pays</Label><Input value={form.country} onChange={set("country")} required /></div>
                  <div className="space-y-2"><Label>Ville</Label><Input value={form.city} onChange={set("city")} required /></div>
                </div>
                <div className="space-y-2"><Label>Adresse</Label><Input value={form.address} onChange={set("address")} required /></div>
              </div>

              <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><Briefcase className="h-5 w-5 text-accent" /></div>
                  <h2 className="font-semibold text-foreground">Profil</h2>
                </div>
                <div className="space-y-2"><Label>Profession / occupation actuelle</Label><Input value={form.occupation} onChange={set("occupation")} required /></div>
                <div className="space-y-2">
                  <Label>Motivation</Label>
                  <Textarea value={form.motivation} onChange={set("motivation")} rows={3} placeholder="Pourquoi voulez-vous devenir agent ?" required />
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><Phone className="h-5 w-5 text-accent" /></div>
                  <h2 className="font-semibold text-foreground">Contact d'urgence</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Nom complet</Label><Input value={form.emergency_contact_name} onChange={set("emergency_contact_name")} required /></div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <PhoneInput value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} required />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={!complete || submit.isPending}>
              {submit.isPending ? "Envoi..." : "Envoyer ma candidature"}
            </Button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DigiMarketProfilePage;
