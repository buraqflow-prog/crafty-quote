import { useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { uiDictionary } from "@/lib/ui-i18n";
import { useUiLanguage } from "@/lib/ui-language";

type InvoiceRow = {
  id: string;
  issued_at: string;
  client_name: string | null;
  invoice_number: string | null;
  document_type: string;
  total_ttc: number;
};

const DASHBOARD_STALE_TIME = 5 * 60 * 1000;

export function DashboardPage() {
  const { user } = useAuth();
  const { uiLanguage } = useUiLanguage();
  const t = uiDictionary[uiLanguage];

  const invoicesQuery = useQuery({
    queryKey: ["dashboard-invoices", user?.id],
    enabled: Boolean(user?.id),
    staleTime: DASHBOARD_STALE_TIME,
    queryFn: async (): Promise<InvoiceRow[]> => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, issued_at, client_name, invoice_number, document_type, total_ttc")
        .eq("user_id", user!.id)
        .order("issued_at", { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      return (data ?? []) as InvoiceRow[];
    },
  });

  useEffect(() => {
    if (invoicesQuery.error) {
      toast.error(t.loadDocumentsError);
    }
  }, [invoicesQuery.error, t.loadDocumentsError]);

  const invoices = invoicesQuery.data ?? [];
  const isInvoicesLoading = invoicesQuery.isLoading;

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
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t.dashboardTitle}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t.dashboardSubtitle}</p>
            </div>
            <Button asChild className="hidden sm:inline-flex">
              <Link to="/invoice/new">
                <Plus className="h-4 w-4" /> {t.newInvoice}
              </Link>
            </Button>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t.totalTtc}</CardTitle>
              </CardHeader>
              <CardContent>{isInvoicesLoading ? <Skeleton className="h-8 w-40" /> : <p className="text-2xl font-semibold text-foreground">{formatAmount(totalTtc)}</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t.totalDocuments}</CardTitle>
              </CardHeader>
              <CardContent>{isInvoicesLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-semibold text-foreground">{totalDocuments}</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t.quotesVsInvoices}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                {isInvoicesLoading ? (
                  <Skeleton className="h-7 w-32" />
                ) : (
                  <>
                    <Badge variant="secondary">{t.quotes}: {totalDevis}</Badge>
                    <Badge>{t.invoices}: {totalFactures}</Badge>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t.recentDocuments}</CardTitle>
            </CardHeader>
            <CardContent>
              {isInvoicesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : invoices.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">{t.noInvoicesYet}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.date}</TableHead>
                      <TableHead>{t.client}</TableHead>
                      <TableHead>{t.docNumber}</TableHead>
                      <TableHead>{t.type}</TableHead>
                      <TableHead className="text-right">{t.total}</TableHead>
                      <TableHead className="w-28 text-right">{t.actions}</TableHead>
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
                        <TableCell className="text-right font-semibold">{formatAmount(Number(invoice.total_ttc ?? 0))}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild variant="ghost" size="icon" aria-label={t.viewDocument}>
                              <Link to="/invoice/new">
                                <Eye className="h-4 w-4" />
                              </Link>
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

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
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
