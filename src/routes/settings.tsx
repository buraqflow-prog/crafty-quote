import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { fetchUserProfile, profileInputSchema, upsertUserProfile, uploadProfileLogo } from "@/lib/profile";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

type SettingsFormState = {
  business_name: string;
  phone: string;
  address: string;
  ice_number: string;
  logo_url: string;
};

const emptyForm: SettingsFormState = {
  business_name: "",
  phone: "",
  address: "",
  ice_number: "",
  logo_url: "",
};

function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<SettingsFormState>(emptyForm);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsProfileLoading(false);
      return;
    }

    setIsProfileLoading(true);

    fetchUserProfile(user.id)
      .then((profile) => {
        if (!profile) {
          setForm(emptyForm);
          return;
        }

        setForm({
          business_name: profile.business_name || "",
          phone: profile.phone || "",
          address: profile.address || "",
          ice_number: profile.ice_number || "",
          logo_url: profile.logo_url || "",
        });
      })
      .catch((error) => {
        console.error(error);
        toast.error("Impossible de charger votre profil.");
      })
      .finally(() => {
        setIsProfileLoading(false);
      });
  }, [user]);

  const isBusy = isSaving || isUploadingLogo;

  const hasValidationErrors = useMemo(() => {
    const parsed = profileInputSchema.safeParse(form);
    return !parsed.success;
  }, [form]);

  if (!user) return null;

  const handleLogoUpload = async (file: File | null) => {
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const publicUrl = await uploadProfileLogo(user.id, file);
      setForm((prev) => ({ ...prev, logo_url: publicUrl }));
      toast.success("Logo téléversé avec succès.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec du téléversement du logo.";
      toast.error(message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (hasValidationErrors) {
      toast.error("Veuillez vérifier les champs du formulaire.");
      return;
    }

    setIsSaving(true);
    try {
      await upsertUserProfile(user.id, form);
      toast.success("Profil mis à jour.");
    } catch {
      toast.error("Impossible de sauvegarder le profil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <main className="min-h-screen bg-background px-4 py-10">
        <section className="mx-auto w-full max-w-3xl rounded-lg border border-border bg-card p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Paramètres entreprise</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gérez les informations utilisées dans vos devis et factures.</p>
          </div>
          <Button type="button" variant="outline" asChild>
            <Link to="/dashboard">Retour</Link>
          </Button>
        </div>

        {isProfileLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Chargement du profil...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Nom de l'entreprise">
              <Input
                value={form.business_name}
                onChange={(event) => setForm((prev) => ({ ...prev, business_name: event.target.value }))}
                placeholder="Atelier Exemple"
              />
            </Field>

            <Field label="Téléphone">
              <Input
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="06XXXXXXXX"
              />
            </Field>

            <Field label="Adresse">
              <Textarea
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                placeholder="Adresse complète"
              />
            </Field>

            <Field label="ICE">
              <Input
                value={form.ice_number}
                onChange={(event) => setForm((prev) => ({ ...prev, ice_number: event.target.value }))}
                placeholder="Numéro ICE"
              />
            </Field>

            <Field label="Logo entreprise">
              <div className="space-y-3 rounded-md border border-border p-3">
                <Input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingLogo}
                  onChange={(event) => {
                    void handleLogoUpload(event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                />

                {isUploadingLogo ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Téléversement en cours...
                  </div>
                ) : null}

                {form.logo_url ? (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-2">
                    <img src={form.logo_url} alt="Logo entreprise" className="h-14 w-20 rounded object-contain" loading="lazy" />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setForm((prev) => ({ ...prev, logo_url: "" }))}
                      disabled={isBusy}
                    >
                      Retirer
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun logo défini.</p>
                )}
              </div>
            </Field>

            <Button type="submit" className="h-11 w-full" disabled={isBusy || hasValidationErrors}>
              {isSaving ? <LoaderCircle className="animate-spin" /> : <Upload />}
              Enregistrer les modifications
            </Button>
          </form>
        )}
        </section>
      </main>
    </AppLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
