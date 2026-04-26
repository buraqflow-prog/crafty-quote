import { Suspense, lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { LoadingSpinner } from "@/components/loading-spinner";

const SettingsPage = lazy(() => import("@/routes/settings-page").then((module) => ({ default: module.SettingsPage })));

export const Route = createFileRoute("/settings")({
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SettingsPage />
    </Suspense>
  );
}
