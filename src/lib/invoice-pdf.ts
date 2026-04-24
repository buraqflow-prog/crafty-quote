import { jsPDF } from "jspdf";

import type { Json } from "@/integrations/supabase/types";

type DownloadInvoicePdfInput = {
  invoiceId: string;
  payload: Json;
  fallback: {
    documentType: string;
    invoiceNumber: string | null;
    clientName: string | null;
    issuedAt: string;
    totalTtc: number;
  };
};

type ParsedInvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
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

function normalizeItems(source: unknown): ParsedInvoiceItem[] {
  if (!Array.isArray(source)) return [];

  return source.map((item) => {
    const obj = toRecord(item);
    const quantity = toNumber(obj?.quantity, 1);
    const unitPrice = toNumber(obj?.unitPrice, 0);
    const explicitLineTotal = toNumber(obj?.lineTotal, Number.NaN);

    return {
      description: toString(obj?.description, "-"),
      quantity,
      unitPrice,
      lineTotal: Number.isFinite(explicitLineTotal) ? explicitLineTotal : quantity * unitPrice,
    };
  });
}

export function downloadInvoicePdf({ invoiceId, payload, fallback }: DownloadInvoicePdfInput) {
  const payloadObj = toRecord(payload);
  const fullState = toRecord(payloadObj?.fullState);
  const fullTotals = toRecord(fullState?.totals);
  const fullClient = toRecord(fullState?.client);
  const businessProfile = toRecord(fullState?.businessProfile);

  const documentType =
    toString(fullState?.documentType) || toString(payloadObj?.documentType) || fallback.documentType;
  const invoiceNumber =
    toString(fullState?.invoiceNumber) || toString(payloadObj?.invoiceNumber) || fallback.invoiceNumber || invoiceId;
  const clientName =
    toString(fullClient?.name) || toString(payloadObj?.clientName) || fallback.clientName || "-";
  const issuedAt =
    toString(fullState?.issuedAt) || toString(payloadObj?.issuedAt) || fallback.issuedAt;
  const totalTtc =
    toNumber(fullTotals?.totalTTC, Number.NaN) || toNumber(payloadObj?.totalTTC, fallback.totalTtc);
  const totalHt = toNumber(fullTotals?.totalHT, toNumber(payloadObj?.totalHT, 0));
  const vatRate = toNumber(fullTotals?.vatRate, toNumber(payloadObj?.vatRate, 0));
  const vatAmount = toNumber(fullTotals?.vatAmount, Math.max(0, totalTtc - totalHt));

  const items = normalizeItems(fullState?.items ?? payloadObj?.items);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const right = pageWidth - 16;
  let y = 16;

  doc.setFontSize(18);
  doc.text(documentType.toUpperCase(), 16, y);
  y += 8;

  doc.setFontSize(11);
  doc.text(`N°: ${invoiceNumber}`, 16, y);
  doc.text(`Date: ${formatDate(issuedAt)}`, right, y, { align: "right" });
  y += 7;

  const businessName = toString(businessProfile?.businessName);
  if (businessName) {
    doc.text(`Entreprise: ${businessName}`, 16, y);
    y += 6;
  }

  doc.text(`Client: ${clientName}`, 16, y);
  y += 8;

  doc.setFontSize(10);
  doc.text("Description", 16, y);
  doc.text("Qté", 118, y, { align: "right" });
  doc.text("PU", 150, y, { align: "right" });
  doc.text("Total", right, y, { align: "right" });
  y += 2;
  doc.line(16, y, right, y);
  y += 5;

  items.forEach((item) => {
    const labelLines = doc.splitTextToSize(item.description || "-", 95);
    doc.text(labelLines, 16, y);
    doc.text(String(item.quantity), 118, y, { align: "right" });
    doc.text(formatMad(item.unitPrice), 150, y, { align: "right" });
    doc.text(formatMad(item.lineTotal), right, y, { align: "right" });
    y += Math.max(6, labelLines.length * 5 + 1);

    if (y > 258) {
      doc.addPage();
      y = 20;
    }
  });

  y += 4;
  doc.line(110, y, right, y);
  y += 7;
  doc.text(`Total HT: ${formatMad(totalHt)}`, right, y, { align: "right" });
  y += 6;

  if (vatRate > 0) {
    doc.text(`TVA (${vatRate}%): ${formatMad(vatAmount)}`, right, y, { align: "right" });
    y += 6;
  }

  doc.setFontSize(12);
  doc.text(`Total TTC: ${formatMad(totalTtc)}`, right, y, { align: "right" });

  const safeNumber = invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`${documentType}_${safeNumber}.pdf`);
}