import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/generator")({
  component: GeneratorPage,
});

function GeneratorPage() {
  return <Navigate to="/invoice/new" />;
}