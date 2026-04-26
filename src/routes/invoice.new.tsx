import { Suspense, lazy, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppLayout } from "@/components/app-layout";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useAuth } from "@/lib/auth";
import { syncOfflineInvoices } from "@/lib/offline-invoice-sync";
import { profileQueryOptions } from "@/lib/profile-query";
import { uiDictionary } from "@/lib/ui-i18n";
import { useUiLanguage } from "@/lib/ui-language";

const QuoteInvoiceApp = lazy(() => import("@/components/quote-invoice-app").then((module) => ({ default: module.QuoteInvoiceApp })));

export const Route = createFileRoute("/invoice/new")({
  component: NewInvoicePage,
});

function NewInvoicePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { uiLanguage } = useUiLanguage();
  const t = uiDictionary[uiLanguage];

  const profileQuery = useQuery({
    ...profileQueryOptions(user?.id ?? ""),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    if (profileQuery.error) {
      toast.error(t.profileLoadError);
    }
  }, [profileQuery.error, t.profileLoadError]);

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
      <Suspense fallback={<LoadingSpinner />}>
        <QuoteInvoiceApp
          userId={user.id}
          profile={profileQuery.data ?? null}
          onOpenSettings={() => navigate({ to: "/settings" })}
          onBack={() => navigate({ to: "/dashboard" })}
        />
      </Suspense>
    </AppLayout>
  );
}