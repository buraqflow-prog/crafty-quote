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

type InvoiceContentLanguage = "fr" | "en" | "ar";

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
    amountInWordsPrefix: "Arrêté le présent document à la somme de :",
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
    amountInWordsPrefix: "This document is hereby set at the amount of:",
    thanks: "Thank you for your trust",
    businessIceLabel: "ICE",
    logoFallback: "LOGO",
  },
  ar: {
    quote: "عرض سعر",
    invoice: "فاتورة",
    emitter: "المُصدِر",
    client: "العميل",
    details: "تفاصيل الخدمات",
    lines: "سطر",
    description: "الوصف",
    price: "الثمن",
    quantity: "الكمية",
    total: "المجموع",
    totalHt: "المجموع دون ضريبة",
    totalVat: "الضريبة",
    totalTtc: "المجموع مع الضريبة",
    totalGlobal: "المجموع الإجمالي",
    amountInWordsPrefix: "حُدِّد هذا المستند بمبلغ:",
    thanks: "شكراً على ثقتكم",
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

function formatAmount(amount: number, language: InvoiceContentLanguage) {
  const locale = language === "en" ? "en-US" : language === "ar" ? "ar-MA" : "fr-FR";
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function toFrenchNumberWords(num: number): string {
  if (num === 0) return "zéro";

  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

  const twoDigits = (n: number): string => {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 70) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      if (unit === 0) return tens[ten];
      if (unit === 1) return `${tens[ten]} et un`;
      return `${tens[ten]}-${units[unit]}`;
    }
    if (n < 80) {
      if (n === 71) return "soixante et onze";
      return `soixante-${twoDigits(n - 60)}`;
    }
    if (n === 80) return "quatre-vingts";
    return `quatre-vingt-${twoDigits(n - 80)}`;
  };

  const threeDigits = (n: number): string => {
    if (n < 100) return twoDigits(n);
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;

    let hundredPart = "";
    if (hundred === 1) {
      hundredPart = "cent";
    } else {
      hundredPart = `${units[hundred]} cent`;
      if (remainder === 0) hundredPart += "s";
    }

    if (remainder === 0) return hundredPart;
    return `${hundredPart} ${twoDigits(remainder)}`;
  };

  const scales = [
    { value: 1_000_000_000, singular: "milliard", plural: "milliards" },
    { value: 1_000_000, singular: "million", plural: "millions" },
    { value: 1_000, singular: "mille", plural: "mille" },
  ];

  let remaining = num;
  const words: string[] = [];

  for (const scale of scales) {
    if (remaining >= scale.value) {
      const count = Math.floor(remaining / scale.value);
      remaining %= scale.value;

      if (scale.value === 1_000) {
        words.push(count === 1 ? "mille" : `${toFrenchNumberWords(count)} mille`);
      } else {
        words.push(`${toFrenchNumberWords(count)} ${count > 1 ? scale.plural : scale.singular}`);
      }
    }
  }

  if (remaining > 0) words.push(threeDigits(remaining));
  return words.join(" ").replace(/\s+/g, " ").trim();
}

function toEnglishNumberWords(num: number): string {
  if (num === 0) return "zero";

  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const scales = ["", "thousand", "million", "billion"];

  const threeDigits = (n: number): string => {
    const parts: string[] = [];
    const h = Math.floor(n / 100);
    const r = n % 100;
    if (h > 0) parts.push(`${ones[h]} hundred`);
    if (r >= 20) {
      const t = Math.floor(r / 10);
      const o = r % 10;
      parts.push(o > 0 ? `${tens[t]}-${ones[o]}` : tens[t]);
    } else if (r >= 10) {
      parts.push(teens[r - 10]);
    } else if (r > 0) {
      parts.push(ones[r]);
    }
    return parts.join(" ");
  };

  let value = num;
  let scaleIndex = 0;
  const parts: string[] = [];
  while (value > 0) {
    const chunk = value % 1000;
    if (chunk > 0) {
      const chunkWords = threeDigits(chunk);
      parts.unshift(scales[scaleIndex] ? `${chunkWords} ${scales[scaleIndex]}` : chunkWords);
    }
    value = Math.floor(value / 1000);
    scaleIndex += 1;
  }
  return parts.join(" ").trim();
}

function toArabicNumberWords(num: number): string {
  if (num === 0) return "صفر";
  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
  const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

  const twoDigits = (n: number): string => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o === 0 ? tens[t] : `${ones[o]} و ${tens[t]}`;
  };

  const threeDigits = (n: number): string => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    if (h === 0) return twoDigits(r);
    if (r === 0) return hundreds[h];
    return `${hundreds[h]} و ${twoDigits(r)}`;
  };

  const chunks = [
    { value: 1_000_000_000, one: "مليار", two: "ملياران", many: "مليارات" },
    { value: 1_000_000, one: "مليون", two: "مليونان", many: "ملايين" },
    { value: 1_000, one: "ألف", two: "ألفان", many: "آلاف" },
  ];

  let remaining = num;
  const parts: string[] = [];
  for (const chunk of chunks) {
    if (remaining >= chunk.value) {
      const count = Math.floor(remaining / chunk.value);
      remaining %= chunk.value;
      if (count === 1) parts.push(chunk.one);
      else if (count === 2) parts.push(chunk.two);
      else if (count >= 3 && count <= 10) parts.push(`${toArabicNumberWords(count)} ${chunk.many}`);
      else parts.push(`${toArabicNumberWords(count)} ${chunk.one}`);
    }
  }

  if (remaining > 0) parts.push(threeDigits(remaining));
  return parts.join(" و ").trim();
}

function toAmountWords(value: number, language: InvoiceContentLanguage): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value * 100) / 100) : 0;
  const major = Math.floor(safeValue);
  const minor = Math.round((safeValue - major) * 100);

  if (language === "en") {
    const majorWords = toEnglishNumberWords(major);
    const minorWords = minor > 0 ? toEnglishNumberWords(minor) : "";
    return minor > 0 ? `${majorWords} dirhams and ${minorWords} cents` : `${majorWords} dirhams`;
  }

  if (language === "ar") {
    const majorWords = toArabicNumberWords(major);
    const minorWords = minor > 0 ? toArabicNumberWords(minor) : "";
    return minor > 0 ? `${majorWords} درهم و ${minorWords} سنتيم` : `${majorWords} درهم`;
  }

  const majorWords = toFrenchNumberWords(major);
  const minorWords = minor > 0 ? toFrenchNumberWords(minor) : "";
  return minor > 0 ? `${majorWords} dirhams et ${minorWords} centimes` : `${majorWords} dirhams`;
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

  const invoiceContentLanguage: InvoiceContentLanguage =
    invoiceContentLanguageRaw === "en" || invoiceContentLanguageRaw === "ar" ? invoiceContentLanguageRaw : "fr";

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
  const amountInWords = toAmountWords(data.isVatEnabled ? data.totalTtc : data.totalHt, data.invoiceContentLanguage);

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
        <td style="border:3px solid #000000;padding:14px 12px;text-align:center;font-size:16px;font-weight:900;color:#000000;">${escapeHtml(formatAmount(item.unitPrice, data.invoiceContentLanguage))}</td>
        <td style="border:3px solid #000000;padding:14px 12px;text-align:center;font-size:14px;font-weight:900;color:#000000;">${item.quantity}</td>
        <td style="border:3px solid #000000;padding:14px 12px;text-align:center;font-size:16px;font-weight:900;color:#000000;">${escapeHtml(formatAmount(item.lineTotal, data.invoiceContentLanguage))}</td>
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
        <tr style="background:#4b5563;color:#ffffff;">
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
              <span>${pdfT.totalHt}</span><span>${escapeHtml(formatAmount(data.totalHt, data.invoiceContentLanguage))}</span>
            </div>
            <div style="margin-top:4px;display:flex;align-items:center;justify-content:space-between;color:#111111;font-size:14px;font-weight:700;">
              <span>${pdfT.totalVat} (${data.vatRate}%)</span><span>${escapeHtml(formatAmount(data.vatAmount, data.invoiceContentLanguage))}</span>
            </div>
            <div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between;background:#4b5563;padding:12px;color:#ffffff;">
              <span style="font-size:14px;font-weight:900;">${pdfT.totalTtc}</span>
              <strong style="font-size:18px;font-weight:900;">${escapeHtml(formatAmount(data.totalTtc, data.invoiceContentLanguage))}</strong>
            </div>
          </div>`
        : `<div style="width:320px;border:2px solid #000000;background:#ffffff;padding:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;background:#4b5563;padding:12px;color:#ffffff;">
              <span style="font-size:14px;font-weight:900;">${pdfT.totalGlobal}</span>
              <strong style="font-size:18px;font-weight:900;">${escapeHtml(formatAmount(data.totalHt, data.invoiceContentLanguage))}</strong>
            </div>
          </div>`}
    </div>
    <p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:#111111;">${pdfT.amountInWordsPrefix} ${escapeHtml(amountInWords)}</p>
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
