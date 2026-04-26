import { createLazyFileRoute } from "@tanstack/react-router";

import { DashboardPage } from "@/routes/dashboard-page";

export const Route = createLazyFileRoute("/dashboard")({
  component: DashboardPage,
});