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
import { uiDictionary } from "@/lib/ui-i18n";
import { useUiLanguage } from "@/lib/ui-language";

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

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function mapDashboardInvoiceToPdfPayload(invoice: InvoiceRow) {
  const rawPayload = parseJsonValue(invoice.payload);
  const payloadRecord = toRecord(rawPayload);
  const fullState = toRecord(parseJsonValue(payloadRecord?.fullState));
  const client = toRecord(parseJsonValue(fullState?.client));
  const totals = toRecord(parseJsonValue(fullState?.totals));
  const businessProfile = toRecord(parseJsonValue(fullState?.businessProfile));
  const settings = toRecord(parseJsonValue(fullState?.settings));

  const rawItems = Array.isArray(fullState?.items)
    ? fullState.items
    : Array.isArray(payloadRecord?.items)
      ? payloadRecord.items
      : [];

  const items = rawItems.map((item, index) => {
    const entry = toRecord(parseJsonValue(item));
    const quantity = toNumber(entry?.quantity, 1);
    const unitPrice = toNumber(entry?.unitPrice, 0);
    const lineTotal = toNumber(entry?.lineTotal, quantity * unitPrice);

    return {
      id: toString(entry?.id, `${index + 1}`),
      description: toString(entry?.description, "N/A"),
      quantity,
      unitPrice,
      lineTotal,
    };
  });

  const computedTotalHt = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalHT = toNumber(payloadRecord?.totalHT, toNumber(totals?.totalHT, computedTotalHt));
  const totalTTC = toNumber(invoice.total_ttc, toNumber(payloadRecord?.totalTTC, toNumber(totals?.totalTTC, totalHT)));
  const vatRate = toNumber(payloadRecord?.vatRate, toNumber(totals?.vatRate, 0));
  const vatAmount = toNumber(totals?.vatAmount, Math.max(0, totalTTC - totalHT));
  const invoiceNumber =
    invoice.invoice_number ||
    toString(fullState?.invoiceNumber, toString(payloadRecord?.invoiceNumber, invoice.id));
  const documentType =
    invoice.document_type ||
    toString(fullState?.documentType, toString(payloadRecord?.documentType, "facture"));
  const issuedAt =
    invoice.issued_at ||
    toString(fullState?.issuedAt, toString(payloadRecord?.issuedAt, new Date().toISOString()));
  const clientName =
    invoice.client_name ||
    toString(client?.name, toString(payloadRecord?.clientName, "N/A"));

  return {
    documentType,
    invoiceNumber,
    clientName,
    clientPhone: toString(client?.phone, toString(payloadRecord?.clientPhone, "N/A")),
    clientAddress: toString(client?.address, toString(payloadRecord?.clientAddress, "N/A")),
    clientIce: toString(client?.ice, toString(payloadRecord?.clientIce, "N/A")),
    items,
    totalHT,
    vatRate,
    totalTTC,
    isVatEnabled: Boolean(totals?.isVatEnabled ?? payloadRecord?.isVatEnabled ?? vatRate > 0),
    issuedAt,
    fullState: {
      uiLanguage: toString(fullState?.uiLanguage, "fr"),
      invoiceContentLanguage: toString(fullState?.invoiceContentLanguage, "fr") === "en" ? "en" : "fr",
      documentType,
      invoiceNumber,
      client: {
        name: clientName,
        phone: toString(client?.phone, toString(payloadRecord?.clientPhone, "N/A")),
        address: toString(client?.address, toString(payloadRecord?.clientAddress, "N/A")),
        ice: toString(client?.ice, toString(payloadRecord?.clientIce, "N/A")),
      },
      items,
      totals: {
        totalHT,
        vatRate,
        vatAmount,
        totalTTC,
        isVatEnabled: Boolean(totals?.isVatEnabled ?? payloadRecord?.isVatEnabled ?? vatRate > 0),
      },
      issuedAt,
      settings: {
        invoicePrefix: toString(settings?.invoicePrefix, ""),
        invoiceSequence: toString(settings?.invoiceSequence, ""),
        autoIncrementInvoiceNumber: Boolean(settings?.autoIncrementInvoiceNumber),
      },
      businessProfile: {
        businessName: toString(businessProfile?.businessName, ""),
        businessAddress: toString(businessProfile?.businessAddress, ""),
        businessPhone: toString(businessProfile?.businessPhone, ""),
        businessIce: toString(businessProfile?.businessIce, ""),
        businessLogoUrl: toString(businessProfile?.businessLogoUrl, ""),
      },
    },
  };
}

function DashboardPage() {
  const { user } = useAuth();
  const { uiLanguage } = useUiLanguage();
  const t = uiDictionary[uiLanguage];
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
        toast.error(t.loadDocumentsError);
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
  }, [t.loadDocumentsError, user]);

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
              <CardContent>{isInvoicesLoading ? <Skeleton className="h-8 w-40" /> : <p className="text-2xl font-semibold text-foreground">{formatMad(totalTtc)}</p>}</CardContent>
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
                        <TableCell className="text-right font-semibold">{formatMad(Number(invoice.total_ttc ?? 0))}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild variant="ghost" size="icon" aria-label={t.viewDocument}>
                              <Link to="/invoice/new">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={t.downloadPdf}
                              onClick={async () => {
                                console.log("Raw Payload from DB:", invoice.payload);

                                const rawPayload = parseJsonValue(invoice.payload);
                                const payloadRecord = toRecord(rawPayload);
                                if (!payloadRecord || Object.keys(payloadRecord).length === 0) {
                                  toast.error("Données du document corrompues");
                                  return;
                                }

                                const mappedPayload = mapDashboardInvoiceToPdfPayload(invoice);
                                try {
                                  await downloadInvoicePdf({
                                    invoiceId: invoice.id,
                                    payload: mappedPayload,
                                    fallback: {
                                      documentType: invoice.document_type,
                                      invoiceNumber: invoice.invoice_number,
                                      clientName: invoice.client_name,
                                      issuedAt: invoice.issued_at,
                                      totalTtc: Number(invoice.total_ttc ?? 0),
                                    },
                                  });
                                } catch (error) {
                                  console.error("Dashboard PDF generation failed", {
                                    error,
                                    invoiceId: invoice.id,
                                    payloadPassedToPdfGenerator: invoice.payload,
                                    fallback: {
                                      documentType: invoice.document_type,
                                      invoiceNumber: invoice.invoice_number,
                                      clientName: invoice.client_name,
                                      issuedAt: invoice.issued_at,
                                      totalTtc: Number(invoice.total_ttc ?? 0),
                                    },
                                  });
                                  toast.error(t.pdfGenerationError);
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