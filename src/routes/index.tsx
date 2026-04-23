import { createFileRoute } from "@tanstack/react-router";
import { QuoteInvoiceApp } from "@/components/quote-invoice-app";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <QuoteInvoiceApp />;
}
