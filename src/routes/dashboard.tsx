import { Suspense, lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { LoadingSpinner } from "@/components/loading-spinner";

const DashboardPage = lazy(() => import("@/routes/dashboard-page").then((module) => ({ default: module.DashboardPage })));

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardPage />
    </Suspense>
  );
}