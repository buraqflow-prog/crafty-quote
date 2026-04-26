type DownloadInvoicePdfInput = {
  invoiceId: string;
  payload: unknown;
  fallback: {
    documentType: string;
    invoiceNumber: string | null;
    clientName: string | null;
    issuedAt: string;
    totalTtc: number;
  };
};

type ParsedInvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type InvoiceContentLanguage = "fr" | "en";

type NormalizedInvoicePdfData = {
  invoiceId: string;
  documentType: string;
  invoiceNumber: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  clientIce: string;
  issuedAt: string;
  totalHt: number;
  vatRate: number;
  vatAmount: number;
  totalTtc: number;
  isVatEnabled: boolean;
  items: ParsedInvoiceItem[];
  invoiceContentLanguage: InvoiceContentLanguage;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessIce: string;
  businessLogoUrl: string;
};

const invoicePdfText = {
  fr: {
    quote: "DEVIS",
    invoice: "FACTURE",
    emitter: "Émetteur",
    client: "Client",
    details: "Détail des prestations",
    lines: "ligne(s)",
    description: "Description",
    price: "Prix",
    quantity: "Quantité",
    total: "Total",
    totalHt: "Total HT",
    totalVat: "TVA",
    totalTtc: "Total TTC",
    totalGlobal: "Total Global",
    thanks: "Merci pour votre confiance",
    businessIceLabel: "ICE",
    logoFallback: "LOGO",
  },
  en: {
    quote: "QUOTE",
    invoice: "INVOICE",
    emitter: "Issuer",
    client: "Client",
    details: "Service details",
    lines: "line(s)",
    description: "Description",
    price: "Price",
    quantity: "Quantity",
    total: "Total",
    totalHt: "Total excl. VAT",
    totalVat: "VAT",
    totalTtc: "Total incl. VAT",
    totalGlobal: "Grand total",
    thanks: "Thank you for your trust",
    businessIceLabel: "ICE",
    logoFallback: "LOGO",
  },
} as const;

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

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function formatMad(amount: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  const normalized = value.trim();
  const slashDateMatch = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const date = slashDateMatch
    ? new Date(`${slashDateMatch[3]}-${slashDateMatch[2]}-${slashDateMatch[1]}T00:00:00`)
    : new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return normalized;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function normalizeItems(source: unknown): ParsedInvoiceItem[] {
  const parsedSource = parseMaybeJson(source);
  if (!Array.isArray(parsedSource)) return [];

  return parsedSource.map((item, index) => {
    const obj = toRecord(parseMaybeJson(item));
    const quantity = toNumber(obj?.quantity, 1);
    const unitPrice = toNumber(obj?.unitPrice, 0);
    const explicitLineTotal = toNumber(obj?.lineTotal, Number.NaN);

    return {
      id: toString(obj?.id, String(index + 1)),
      description: toString(obj?.description, "-"),
      quantity,
      unitPrice,
      lineTotal: Number.isFinite(explicitLineTotal) ? explicitLineTotal : quantity * unitPrice,
    };
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function imageUrlToDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) return null;
    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("Invalid image data"));
      };
      reader.onerror = () => reject(reader.error ?? new Error("Image conversion failed"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function buildInvoicePdfDataFromPayload({ invoiceId, payload, fallback }: DownloadInvoicePdfInput): NormalizedInvoicePdfData {
  const parsedPayload = parseMaybeJson(payload);
  const payloadObj = toRecord(parsedPayload);
  const fullState = toRecord(parseMaybeJson(payloadObj?.fullState));
  const fullTotals = toRecord(parseMaybeJson(fullState?.totals));
  const fullClient = toRecord(parseMaybeJson(fullState?.client));
  const businessProfile = toRecord(parseMaybeJson(fullState?.businessProfile));

  const documentType =
    toString(fullState?.documentType) ||
    toString(payloadObj?.documentType) ||
    fallback.documentType ||
    "facture";

  const invoiceNumber =
    toString(fullState?.invoiceNumber) ||
    toString(payloadObj?.invoiceNumber) ||
    fallback.invoiceNumber ||
    invoiceId;

  const clientName =
    toString(fullClient?.name) ||
    toString(payloadObj?.clientName) ||
    fallback.clientName ||
    "-";

  const issuedAt =
    toString(fullState?.issuedAt) ||
    toString(payloadObj?.issuedAt) ||
    fallback.issuedAt;

  const items = normalizeItems(fullState?.items ?? payloadObj?.items);
  const itemsTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  const totalHt = toNumber(fullTotals?.totalHT, toNumber(payloadObj?.totalHT, itemsTotal));
  const totalTtc = toNumber(fullTotals?.totalTTC, toNumber(payloadObj?.totalTTC, fallback.totalTtc));
  const vatRate = toNumber(fullTotals?.vatRate, toNumber(payloadObj?.vatRate, 0));
  const vatAmount = toNumber(fullTotals?.vatAmount, Math.max(0, totalTtc - totalHt));
  const isVatEnabled = Boolean(fullTotals?.isVatEnabled ?? payloadObj?.isVatEnabled ?? vatRate > 0);

  const invoiceContentLanguageRaw =
    toString(fullState?.invoiceContentLanguage) ||
    toString(fullState?.language) ||
    toString(payloadObj?.invoiceContentLanguage) ||
    toString(payloadObj?.language) ||
    "fr";

  const invoiceContentLanguage: InvoiceContentLanguage = invoiceContentLanguageRaw === "en" ? "en" : "fr";

  return {
    invoiceId,
    documentType,
    invoiceNumber,
    clientName,
    clientPhone: toString(fullClient?.phone, toString(payloadObj?.clientPhone, "-")) || "-",
    clientAddress: toString(fullClient?.address, toString(payloadObj?.clientAddress, "")),
    clientIce: toString(fullClient?.ice, toString(payloadObj?.clientIce, "")),
    issuedAt,
    totalHt,
    vatRate,
    vatAmount,
    totalTtc,
    isVatEnabled,
    items,
    invoiceContentLanguage,
    businessName: toString(businessProfile?.businessName, "Votre entreprise"),
    businessAddress: toString(businessProfile?.businessAddress, "Adresse non renseignée"),
    businessPhone: toString(businessProfile?.businessPhone, "-"),
    businessIce: toString(businessProfile?.businessIce, ""),
    businessLogoUrl: toString(businessProfile?.businessLogoUrl, ""),
  };
}

async function generateInvoicePdf(data: NormalizedInvoicePdfData) {
  const pdfT = invoicePdfText[data.invoiceContentLanguage];
  const businessLogoDataUrl = data.businessLogoUrl ? await imageUrlToDataUrl(data.businessLogoUrl) : null;
  const documentTitle = data.documentType === "devis" ? pdfT.quote : pdfT.invoice;

  const template = document.createElement("div");
  template.style.position = "fixed";
  template.style.left = "-99999px";
  template.style.top = "0";
  template.style.width = "794px";
  template.style.minHeight = "1123px";
  template.style.backgroundColor = "#ffffff";
  template.style.padding = "36px 40px";
  template.style.color = "#111111";
  template.style.fontFamily = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';
  template.style.boxSizing = "border-box";

  const rows = data.items
    .map(
      (item) => `
      <tr style="background:#ffffff;">
        <td style="border:3px solid #000000;padding:14px 12px;font-size:14px;font-weight:700;color:#000000;word-break:break-word;">${escapeHtml(item.description || "-")}</td>
        <td style="border:3px solid #000000;padding:14px 12px;text-align:center;font-size:16px;font-weight:900;color:#000000;">${escapeHtml(formatMad(item.unitPrice))}</td>
        <td style="border:3px solid #000000;padding:14px 12px;text-align:center;font-size:14px;font-weight:900;color:#000000;">${item.quantity}</td>
        <td style="border:3px solid #000000;padding:14px 12px;text-align:center;font-size:16px;font-weight:900;color:#000000;">${escapeHtml(formatMad(item.lineTotal))}</td>
      </tr>
    `,
    )
    .join("");

  template.innerHTML = `
    <header style="display:flex;align-items:flex-start;justify-content:space-between;gap:32px;">
      <div>
        <p style="margin:0 0 32px;font-size:64px;line-height:1;text-transform:uppercase;color:#111111;">${documentTitle}</p>
      </div>
      <div style="display:flex;min-height:128px;min-width:160px;flex-direction:column;align-items:flex-end;justify-content:flex-start;gap:16px;">
        ${businessLogoDataUrl
          ? `<img src="${escapeHtml(businessLogoDataUrl)}" alt="logo" style="height:128px;width:auto;object-fit:contain;" />`
          : `<div style="display:flex;height:128px;width:160px;align-items:center;justify-content:center;border:1px solid #111111;border-radius:999px;font-size:12px;font-weight:500;color:#111111;">${pdfT.logoFallback}</div>`}
        <div style="display:flex;gap:8px;">
          <span style="border:1px solid #111111;border-radius:999px;padding:4px 16px;font-size:14px;font-weight:500;color:#111111;">${documentTitle} n°${escapeHtml(data.invoiceNumber)}</span>
          <span style="border:1px solid #111111;border-radius:999px;padding:4px 16px;font-size:14px;font-weight:500;color:#111111;">${escapeHtml(formatDate(data.issuedAt))}</span>
        </div>
      </div>
    </header>
    <hr style="margin:32px 0;border:none;border-top:1px solid #111111;" />
    <section style="margin-bottom:32px;display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div style="border:1px solid #000000;background:#ffffff;padding:16px;">
        <p style="margin:0;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#111111;">${pdfT.emitter}</p>
        <p style="margin:8px 0 0;font-size:14px;font-weight:700;text-transform:uppercase;color:#111111;">${escapeHtml(data.businessName)}</p>
        <p style="margin:4px 0 0;font-size:14px;line-height:1.5;color:#111111;white-space:pre-line;">${escapeHtml(data.businessAddress)}</p>
        <p style="margin:4px 0 0;font-size:14px;color:#111111;">${escapeHtml(data.businessPhone)}</p>
        ${data.businessIce ? `<p style="margin:4px 0 0;font-size:14px;color:#111111;">${pdfT.businessIceLabel}: ${escapeHtml(data.businessIce)}</p>` : ""}
      </div>
      <div style="border:1px solid #000000;background:#ffffff;padding:16px;text-align:right;">
        <p style="margin:0;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#111111;">${pdfT.client}</p>
        <p style="margin:8px 0 0;font-size:14px;font-weight:700;text-transform:uppercase;color:#111111;">${escapeHtml(data.clientName || "-")}</p>
        <p style="margin:4px 0 0;font-size:14px;color:#111111;">${escapeHtml(data.clientPhone)}</p>
        ${data.clientAddress ? `<p style="margin:4px 0 0;font-size:14px;line-height:1.5;color:#111111;">${escapeHtml(data.clientAddress)}</p>` : ""}
        ${data.clientIce ? `<p style="margin:4px 0 0;font-size:14px;color:#111111;">${pdfT.businessIceLabel}: ${escapeHtml(data.clientIce)}</p>` : ""}
      </div>
    </section>
    <div style="margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
      <p style="margin:0;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#111111;">${pdfT.details}</p>
      <p style="margin:0;font-size:12px;font-weight:500;color:#111111;">${data.items.length} ${pdfT.lines}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;border:4px solid #000000;">
      <thead>
        <tr style="background:#000000;color:#ffffff;">
          <th style="border:3px solid #000000;padding:12px;text-align:center;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#ffffff;">${pdfT.description}</th>
          <th style="border:3px solid #000000;padding:12px;text-align:center;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#ffffff;">${pdfT.price}</th>
          <th style="border:3px solid #000000;padding:12px;text-align:center;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#ffffff;">${pdfT.quantity}</th>
          <th style="border:3px solid #000000;padding:12px;text-align:center;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#ffffff;">${pdfT.total}</th>
        </tr>
      </thead>
      <tbody>
        ${rows || ""}
      </tbody>
    </table>
    <div style="margin-top:20px;display:flex;justify-content:flex-end;">
      ${data.isVatEnabled
        ? `<div style="width:320px;border:2px solid #000000;background:#ffffff;padding:12px;text-align:right;">
            <div style="display:flex;align-items:center;justify-content:space-between;color:#111111;font-size:14px;font-weight:700;">
              <span>${pdfT.totalHt}</span><span>${escapeHtml(formatMad(data.totalHt))}</span>
            </div>
            <div style="margin-top:4px;display:flex;align-items:center;justify-content:space-between;color:#111111;font-size:14px;font-weight:700;">
              <span>${pdfT.totalVat} (${data.vatRate}%)</span><span>${escapeHtml(formatMad(data.vatAmount))}</span>
            </div>
            <div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between;background:#000000;padding:12px;color:#ffffff;">
              <span style="font-size:14px;font-weight:900;">${pdfT.totalTtc}</span>
              <strong style="font-size:18px;font-weight:900;">${escapeHtml(formatMad(data.totalTtc))}</strong>
            </div>
          </div>`
        : `<div style="width:320px;border:2px solid #000000;background:#ffffff;padding:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;background:#000000;padding:12px;color:#ffffff;">
              <span style="font-size:14px;font-weight:900;">${pdfT.totalGlobal}</span>
              <strong style="font-size:18px;font-weight:900;">${escapeHtml(formatMad(data.totalHt))}</strong>
            </div>
          </div>`}
    </div>
    <footer style="margin-top:40px;">
      <hr style="margin:0 0 8px;border:none;border-top:1px solid #111111;" />
      <p style="margin:0;font-size:12px;font-weight:700;color:#111111;">${pdfT.thanks}</p>
    </footer>
  `;

  const sandbox = document.createElement("iframe");
  sandbox.style.position = "fixed";
  sandbox.style.left = "-99999px";
  sandbox.style.top = "0";
  sandbox.style.width = "1px";
  sandbox.style.height = "1px";
  sandbox.style.border = "0";
  sandbox.setAttribute("aria-hidden", "true");

  document.body.appendChild(sandbox);

  const sandboxDoc = sandbox.contentDocument;
  if (!sandboxDoc) {
    sandbox.remove();
    throw new Error("PDF rendering sandbox unavailable");
  }

  sandboxDoc.open();
  sandboxDoc.write(`<!doctype html><html><head><meta charset="utf-8"/></head><body style="margin:0;background:#ffffff;"></body></html>`);
  sandboxDoc.close();

  sandboxDoc.body.appendChild(template);

  try {
    if (sandboxDoc.fonts?.ready) {
      await sandboxDoc.fonts.ready;
    }

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

    const renderCanvas = async (scale: number) =>
      html2canvas(template, {
        scale,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: template.scrollWidth,
        windowHeight: template.scrollHeight,
      });

    let canvas: HTMLCanvasElement;
    try {
      canvas = await renderCanvas(3);
    } catch {
      template.querySelectorAll("img").forEach((img) => img.remove());
      try {
        canvas = await renderCanvas(2);
      } catch {
        canvas = await renderCanvas(1);
      }
    }

    const orientation = canvas.width > canvas.height ? "landscape" : "portrait";
    const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
    const pageWidth = orientation === "portrait" ? 210 : 297;
    const pageHeight = orientation === "portrait" ? 297 : 210;
    const margin = 10;
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;

    const canvasPageHeightPx = Math.floor((printableHeight * canvas.width) / printableWidth);
    let renderedHeightPx = 0;
    let pageIndex = 0;

    while (renderedHeightPx < canvas.height) {
      const sliceHeight = Math.min(canvasPageHeightPx, canvas.height - renderedHeightPx);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;

      const pageContext = pageCanvas.getContext("2d");
      if (!pageContext) throw new Error("Canvas context unavailable");

      pageContext.drawImage(canvas, 0, renderedHeightPx, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

      const imageData = pageCanvas.toDataURL("image/jpeg", 0.98);
      const imageHeightMm = (sliceHeight * printableWidth) / canvas.width;

      if (pageIndex > 0) {
        pdf.addPage("a4", orientation);
      }

      pdf.addImage(imageData, "JPEG", margin, margin, printableWidth, imageHeightMm);
      renderedHeightPx += sliceHeight;
      pageIndex += 1;
    }

    const safeNumber = data.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, "_");
    pdf.save(`${data.documentType}_${safeNumber}.pdf`);
  } finally {
    template.remove();
    sandbox.remove();
  }
}

export async function downloadInvoicePdf(input: DownloadInvoicePdfInput) {
  const pdfData = buildInvoicePdfDataFromPayload(input);
  await generateInvoicePdf(pdfData);
}
