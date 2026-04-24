import { Navigate, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { QuoteInvoiceApp } from "@/components/quote-invoice-app";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <QuoteInvoiceApp
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
