import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  return <Navigate to="/" />;
}