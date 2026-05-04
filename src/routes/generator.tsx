import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/generator")({
  beforeLoad: () => {
    throw redirect({ to: "/invoice/new" });
  },
  component: () => null,
});