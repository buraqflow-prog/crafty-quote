import { useEffect, useState } from "react";
import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { QuoteInvoiceApp } from "@/components/quote-invoice-app";
import { useAuth } from "@/lib/auth";
import { fetchUserProfile, type UserProfile } from "@/lib/profile";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) return;

    fetchUserProfile(user.id)
      .then((data) => setProfile(data))
      .catch(() => {
        toast.error("Impossible de charger votre profil.");
      });
  }, [user]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <QuoteInvoiceApp
      profile={profile}
      onOpenSettings={() => navigate({ to: "/settings" })}
      onLogout={async () => {
        try {
          await signOut();
          toast.success("Déconnexion réussie");
        } catch {
          toast.error("Impossible de se déconnecter");
        }
      }}
    />
  );
}
