import { useEffect, useState } from "react";
import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { QuoteInvoiceApp } from "@/components/quote-invoice-app";
import { useAuth } from "@/lib/auth";
import { syncOfflineInvoices } from "@/lib/offline-invoice-sync";
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

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    const handleReconnect = async () => {
      try {
        const { synced } = await syncOfflineInvoices();
        if (synced > 0) {
          toast.success("Synchronisation réussie !");
        }
      } catch {
        // keep queue for next retry
      }
    };

    window.addEventListener("online", handleReconnect);

    if (window.navigator.onLine) {
      void handleReconnect();
    }

    return () => {
      window.removeEventListener("online", handleReconnect);
    };
  }, [user]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <QuoteInvoiceApp
      userId={user.id}
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
