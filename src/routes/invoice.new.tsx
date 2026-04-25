import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppLayout } from "@/components/app-layout";
import { QuoteInvoiceApp } from "@/components/quote-invoice-app";
import { useAuth } from "@/lib/auth";
import { syncOfflineInvoices } from "@/lib/offline-invoice-sync";
import { fetchUserProfile, type UserProfile } from "@/lib/profile";
import { uiDictionary } from "@/lib/ui-i18n";
import { useUiLanguage } from "@/lib/ui-language";

export const Route = createFileRoute("/invoice/new")({
  component: NewInvoicePage,
});

function NewInvoicePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { uiLanguage } = useUiLanguage();
  const t = uiDictionary[uiLanguage];
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) return;

    fetchUserProfile(user.id)
      .then((data) => setProfile(data))
      .catch(() => {
        toast.error(t.profileLoadError);
      });
  }, [t.profileLoadError, user]);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    const handleReconnect = async () => {
      try {
        const { synced } = await syncOfflineInvoices();
        if (synced > 0) {
          toast.success(t.syncSuccess);
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
  }, [t.syncSuccess, user]);

  if (!user) return null;

  return (
    <AppLayout>
      <QuoteInvoiceApp
        userId={user.id}
        profile={profile}
        onOpenSettings={() => navigate({ to: "/settings" })}
        onBack={() => navigate({ to: "/dashboard" })}
      />
    </AppLayout>
  );
}