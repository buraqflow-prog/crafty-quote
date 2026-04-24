import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Download, Eye, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

type InvoiceRow = {
  id: string;
  issued_at: string;
  client_name: string | null;
  invoice_number: string | null;
  document_type: string;
  total_ttc: number;
  payload: Json;
};

function DashboardPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [isInvoicesLoading, setIsInvoicesLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setInvoices([]);
      setIsInvoicesLoading(false);
      return;
    }

    let mounted = true;
    setIsInvoicesLoading(true);

    const loadInvoices = async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, issued_at, client_name, invoice_number, document_type, total_ttc, payload")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        toast.error("Impossible de charger les documents.");
        setInvoices([]);
        setIsInvoicesLoading(false);
        return;
      }

      setInvoices((data ?? []) as InvoiceRow[]);
      setIsInvoicesLoading(false);
    };

    void loadInvoices();
    return () => {
      mounted = false;
    };
  }, [user]);

  const totalTtc = useMemo(() => invoices.reduce((sum, invoice) => sum + Number(invoice.total_ttc ?? 0), 0), [invoices]);
  const totalDocuments = invoices.length;
  const totalDevis = useMemo(() => invoices.filter((invoice) => invoice.document_type === "devis").length, [invoices]);
  const totalFactures = useMemo(() => invoices.filter((invoice) => invoice.document_type === "facture").length, [invoices]);

  return (
    <AppLayout>
      <main className="min-h-screen bg-background px-4 py-8">
        <section className="mx-auto w-full max-w-6xl space-y-6">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard Artisan</h1>
              <p className="mt-1 text-sm text-muted-foreground">Suivi de vos devis et factures en temps réel.</p>
            </div>
            <Button asChild className="hidden sm:inline-flex">
              <Link to="/invoice/new">
                <Plus className="h-4 w-4" /> Nouvelle Facture
              </Link>
            </Button>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total TTC</CardTitle>
              </CardHeader>
              <CardContent>{isInvoicesLoading ? <Skeleton className="h-8 w-40" /> : <p className="text-2xl font-semibold text-foreground">{formatMad(totalTtc)}</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
              </CardHeader>
              <CardContent>{isInvoicesLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-semibold text-foreground">{totalDocuments}</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Devis vs Factures</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                {isInvoicesLoading ? (
                  <Skeleton className="h-7 w-32" />
                ) : (
                  <>
                    <Badge variant="secondary">Devis: {totalDevis}</Badge>
                    <Badge>Factures: {totalFactures}</Badge>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Documents récents</CardTitle>
            </CardHeader>
            <CardContent>
              {isInvoicesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : invoices.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Aucune facture pour le moment</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>N° Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-28 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{formatDate(invoice.issued_at)}</TableCell>
                        <TableCell className="font-medium">{invoice.client_name || "-"}</TableCell>
                        <TableCell>{invoice.invoice_number || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {invoice.document_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatMad(Number(invoice.total_ttc ?? 0))}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild variant="ghost" size="icon" aria-label="Voir le document">
                              <Link to="/invoice/new">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Télécharger PDF"
                              onClick={() => {
                                try {
                                  downloadInvoicePdf({
                                    invoiceId: invoice.id,
                                    payload: invoice.payload,
                                    fallback: {
                                      documentType: invoice.document_type,
                                      invoiceNumber: invoice.invoice_number,
                                      clientName: invoice.client_name,
                                      issuedAt: invoice.issued_at,
                                      totalTtc: Number(invoice.total_ttc ?? 0),
                                    },
                                  });
                                } catch {
                                  toast.error("Impossible de générer le PDF pour ce document.");
                                }
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </AppLayout>
  );
}

function formatMad(amount: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}