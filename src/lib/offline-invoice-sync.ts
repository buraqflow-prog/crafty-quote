import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

export const OFFLINE_INVOICES_QUEUE_KEY = "offline_invoices_queue";

export type InvoicePayload = {
  documentType: "devis" | "facture";
  invoiceNumber: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  clientIce: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalHT: number;
  vatRate: number;
  totalTTC: number;
  isVatEnabled: boolean;
  issuedAt: string;
  fullState: {
    language: "fr" | "ar";
    documentType: "devis" | "facture";
    invoiceNumber: string;
    client: {
      name: string;
      phone: string;
      address: string;
      ice: string;
    };
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
    totals: {
      totalHT: number;
      vatRate: number;
      vatAmount: number;
      totalTTC: number;
      isVatEnabled: boolean;
    };
    issuedAt: string;
    settings: {
      invoicePrefix: string;
      invoiceSequence: string;
      autoIncrementInvoiceNumber: boolean;
    };
    businessProfile: {
      businessName: string;
      businessAddress: string;
      businessPhone: string;
      businessIce: string;
      businessLogoUrl: string;
    };
  };
};

type OfflineInvoiceQueueItem = {
  userId: string;
  payload: InvoicePayload;
  queuedAt: string;
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readOfflineQueue(): OfflineInvoiceQueueItem[] {
  if (!canUseLocalStorage()) return [];

  try {
    const raw = window.localStorage.getItem(OFFLINE_INVOICES_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OfflineInvoiceQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOfflineQueue(queue: OfflineInvoiceQueueItem[]) {
  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.setItem(OFFLINE_INVOICES_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore quota errors in UI layer
  }
}

function toInvoiceInsert(userId: string, payload: InvoicePayload): TablesInsert<"invoices"> {
  return {
    user_id: userId,
    document_type: payload.documentType,
    invoice_number: payload.invoiceNumber,
    client_name: payload.clientName || null,
    total_ht: payload.totalHT,
    vat_rate: payload.isVatEnabled ? payload.vatRate : 0,
    total_ttc: payload.totalTTC,
    issued_at: payload.issuedAt,
    payload,
  };
}

export async function saveInvoiceOnline(userId: string, payload: InvoicePayload) {
  const { error } = await supabase.from("invoices").insert(toInvoiceInsert(userId, payload));
  if (error) throw error;
}

export function enqueueOfflineInvoice(userId: string, payload: InvoicePayload) {
  const current = readOfflineQueue();
  current.push({ userId, payload, queuedAt: new Date().toISOString() });
  writeOfflineQueue(current);
}

export async function syncOfflineInvoices() {
  const queue = readOfflineQueue();
  if (queue.length === 0) return { synced: 0 };

  const failed: OfflineInvoiceQueueItem[] = [];
  let synced = 0;

  for (const queued of queue) {
    try {
      await saveInvoiceOnline(queued.userId, queued.payload);
      synced += 1;
    } catch {
      failed.push(queued);
    }
  }

  writeOfflineQueue(failed);
  return { synced };
}
