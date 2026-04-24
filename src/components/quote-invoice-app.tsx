import { useEffect, useMemo, useRef, useState } from "react";
import { Settings, Plus, Trash2, FileText, MessageCircle, LoaderCircle, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { UserProfile } from "@/lib/profile";

type DocumentType = "devis" | "facture";
type UILanguage = "fr" | "ar";

type BusinessSettings = {
  invoicePrefix: string;
  invoiceSequence: string;
  autoIncrementInvoiceNumber: boolean;
};

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

const STORAGE_KEY = "craftsman_invoice_settings_v1";

const emptySettings: BusinessSettings = {
  invoicePrefix: "",
  invoiceSequence: "",
  autoIncrementInvoiceNumber: false,
};

const createItem = (): InvoiceItem => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 1,
  unitPrice: 0,
});

const uiText = {
  fr: {
    appTitle: "Devis / Facture",
    appSubtitle: "Générateur élégant pour artisans",
    languageToggle: "Changer la langue",
    languageFr: "Fr",
    languageAr: "Ar",
    openSettings: "Ouvrir les paramètres",
    manageProfile: "Profil",
    settingsTitle: "Paramètres entreprise",
    settingsDescription: "Paramètres de numérotation enregistrés localement.",
    invoicePrefixLabel: "Préfixe Devis / Facture",
    invoicePrefixPlaceholder: "FAC-",
    invoiceSequenceLabel: "Numérotation",
    invoiceSequencePlaceholder: "00012",
    autoIncrementInvoiceNumberLabel: "Incrémenter automatiquement au clic sur Générer le PDF",
    save: "Enregistrer",
    clientInfoTitle: "Informations client",
    clientNameLabel: "Nom du Client",
    clientNamePlaceholder: "Nom complet",
    clientPhoneLabel: "Téléphone du Client",
    clientPhonePlaceholder: "06XXXXXXXX",
    clientAddressLabel: "Adresse du Client (Optionnel)",
    clientAddressPlaceholder: "Adresse du client",
    clientIceLabel: "ICE du Client (Optionnel)",
    clientIcePlaceholder: "Numéro ICE du client",
    documentTypeLabel: "Type de document",
    quoteLabel: "Devis",
    invoiceLabel: "Facture",
    itemsTitle: "Services / Articles",
    addLine: "Ajouter",
    lineLabel: "Ligne",
    deleteLine: "Supprimer la ligne",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Ex: Installation électrique",
    quantityLabel: "Quantité",
    unitPriceLabel: "Prix Unitaire",
    subtotalLabel: "Sous-total",
    totalGlobalLabel: "Total Global",
    applyVatLabel: "Appliquer la TVA",
    vatRateLabel: "Taux TVA (%)",
    totalHtLabel: "Total HT",
    vatAmountLabel: "Montant TVA",
    totalTtcLabel: "Total TTC",
    generatePdfLabel: "Générer le PDF",
    generatingPdfLabel: "Génération en cours...",
    sendWhatsAppLabel: "Envoyer par WhatsApp",
    logoutLabel: "Déconnexion",
  },
  ar: {
    appTitle: "عرض سعر / فاتورة",
    appSubtitle: "مولّد أنيق للحرفيين",
    languageToggle: "تغيير اللغة",
    languageFr: "Fr",
    languageAr: "Ar",
    openSettings: "الإعدادات",
    manageProfile: "الملف",
    settingsTitle: "إعدادات الشركة",
    settingsDescription: "إعدادات الترقيم يتم حفظها محليًا.",
    invoicePrefixLabel: "بادئة عرض السعر / الفاتورة",
    invoicePrefixPlaceholder: "FAC-",
    invoiceSequenceLabel: "الترقيم",
    invoiceSequencePlaceholder: "00012",
    autoIncrementInvoiceNumberLabel: "زيادة الترقيم تلقائيًا عند الضغط على إنشاء الفاتورة",
    save: "حفظ",
    clientInfoTitle: "معلومات الزبون",
    clientNameLabel: "اسم الزبون",
    clientNamePlaceholder: "الاسم الكامل",
    clientPhoneLabel: "هاتف الزبون",
    clientPhonePlaceholder: "06XXXXXXXX",
    clientAddressLabel: "عنوان الزبون (اختياري)",
    clientAddressPlaceholder: "عنوان الزبون",
    clientIceLabel: "ICE الزبون (اختياري)",
    clientIcePlaceholder: "رقم ICE للزبون",
    documentTypeLabel: "نوع المستند",
    quoteLabel: "عرض سعر",
    invoiceLabel: "فاتورة",
    itemsTitle: "الخدمات / العناصر",
    addLine: "إضافة",
    lineLabel: "البند",
    deleteLine: "حذف البند",
    descriptionLabel: "الوصف",
    descriptionPlaceholder: "مثال: تركيب كهرباء",
    quantityLabel: "الكمية",
    unitPriceLabel: "سعر الوحدة",
    subtotalLabel: "المجموع الفرعي",
    totalGlobalLabel: "المجموع الإجمالي",
    applyVatLabel: "تطبيق الضريبة",
    vatRateLabel: "نسبة الضريبة (%)",
    totalHtLabel: "المجموع قبل الضريبة",
    vatAmountLabel: "قيمة الضريبة",
    totalTtcLabel: "المجموع مع الضريبة",
    generatePdfLabel: "إنشاء الفاتورة",
    generatingPdfLabel: "جاري الإنشاء...",
    sendWhatsAppLabel: "إرسال عبر واتساب",
    logoutLabel: "تسجيل الخروج",
  },
} as const;

export function QuoteInvoiceApp({
  onLogout,
  onOpenSettings,
  profile,
}: {
  onLogout?: () => void | Promise<void>;
  onOpenSettings?: () => void;
  profile?: UserProfile | null;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>(emptySettings);
  const [settingsDraft, setSettingsDraft] = useState<BusinessSettings>(settings);
  const [language, setLanguage] = useState<UILanguage>("fr");

  const [docType, setDocType] = useState<DocumentType>("devis");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientIce, setClientIce] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([createItem()]);
  const [isVatEnabled, setIsVatEnabled] = useState(false);
  const [vatRate, setVatRate] = useState(20);
  const [isExporting, setIsExporting] = useState(false);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);
  const isArabic = language === "ar";
  const t = uiText[language];
  const canUseLocalStorage = typeof window !== "undefined";

  useEffect(() => {
    if (!canUseLocalStorage) return;

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const stored = { ...emptySettings, ...(JSON.parse(raw) as Partial<BusinessSettings>) };
      setSettings(stored);
      setSettingsDraft(stored);
    } catch {
      setSettings(emptySettings);
      setSettingsDraft(emptySettings);
    }
  }, [canUseLocalStorage]);

  const today = new Date().toLocaleDateString("fr-FR");
  const formattedInvoiceNumber = `${settings.invoicePrefix || "FAC-"}${settings.invoiceSequence || "00012"}`;

  const totalHT = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items],
  );
  const vatAmount = useMemo(() => (isVatEnabled ? totalHT * (vatRate / 100) : 0), [isVatEnabled, totalHT, vatRate]);
  const totalTTC = useMemo(() => totalHT + vatAmount, [totalHT, vatAmount]);
  const amountInWords = useMemo(() => toFrenchCurrencyWords(totalTTC), [totalTTC]);

  const saveSettings = () => {
    setSettings(settingsDraft);
    if (canUseLocalStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsDraft));
    }
    setIsSettingsOpen(false);
  };

  const incrementInvoiceNumber = () => {
    setSettings((prev) => {
      const next = {
        ...prev,
        invoiceSequence: incrementSequence(prev.invoiceSequence || "00012"),
      };
      if (canUseLocalStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      setSettingsDraft(next);
      return next;
    });
  };

  const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const businessName = profile?.business_name?.trim() || "Votre entreprise";
  const businessAddress = profile?.address?.trim() || "Adresse";
  const businessPhone = profile?.phone?.trim() || "-";
  const businessIce = profile?.ice_number?.trim() || "";
  const businessLogoUrl = profile?.logo_url?.trim() || "";

  const generatePdf = async () => {
    if (isExporting || !pdfTemplateRef.current) return;

    setIsExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

      const templateWidthPx = pdfTemplateRef.current.offsetWidth;
      const templateHeightPx = pdfTemplateRef.current.offsetHeight;
      const expectedA4HeightPx = templateWidthPx * (297 / 210);
      const heightDelta = Math.abs(templateHeightPx - expectedA4HeightPx);

      if (heightDelta > 8) {
        throw new Error(`Template A4 invalide: hauteur attendue ${Math.round(expectedA4HeightPx)}px, actuelle ${Math.round(templateHeightPx)}px.`);
      }

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const canvas = await html2canvas(pdfTemplateRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          clonedDoc.documentElement.style.backgroundColor = "#ffffff";
          clonedDoc.documentElement.style.color = "#0f172a";
          clonedDoc.body.style.backgroundColor = "#ffffff";
          clonedDoc.body.style.color = "#0f172a";
          clonedDoc.body.style.borderColor = "#cbd5e1";

          const clonedTemplate = clonedDoc.getElementById("pdf-template");
          if (clonedTemplate) {
            clonedTemplate.style.backgroundColor = "#ffffff";
            clonedTemplate.style.color = "#0f172a";
            clonedTemplate.style.borderColor = "#cbd5e1";
            clonedTemplate.style.fontFamily = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';
            clonedTemplate.style.setProperty("--background", "#ffffff");
            clonedTemplate.style.setProperty("--foreground", "#0f172a");
            clonedTemplate.style.setProperty("--card", "#ffffff");
            clonedTemplate.style.setProperty("--muted", "#f8fafc");
            clonedTemplate.style.setProperty("--border", "#cbd5e1");
            clonedTemplate.style.setProperty("--ring", "#94a3b8");

            clonedTemplate.querySelectorAll<HTMLElement>("*").forEach((element) => {
              element.style.color = element.style.color || "#0f172a";
              element.style.borderColor = element.style.borderColor || "#cbd5e1";
              if (!element.style.backgroundColor || element.style.backgroundColor === "oklch") {
                element.style.backgroundColor = "transparent";
              }
              element.style.setProperty("--background", "#ffffff");
              element.style.setProperty("--foreground", "#0f172a");
              element.style.setProperty("--card", "#ffffff");
              element.style.setProperty("--muted", "#f8fafc");
              element.style.setProperty("--border", "#cbd5e1");
              element.style.setProperty("--ring", "#94a3b8");
            });
          }
        },
      });

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
        if (!pageContext) throw new Error("Impossible de créer le contexte canvas pour la pagination.");

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

      const safeClient = clientName.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "") || "client";
      const fileName = `${docType}_${safeClient}_${Date.now()}.pdf`;
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

      const downloadPdf = () => {
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      };

      if (navigator.canShare?.({ files: [pdfFile] }) && navigator.share) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: docType === "devis" ? "DEVIS" : "FACTURE",
            text: "Document PDF",
          });
          toast.success("PDF prêt à être partagé");
          return;
        } catch {
          downloadPdf();
          toast("Partage indisponible, téléchargement lancé.");
          return;
        }
      }

      downloadPdf();
      toast.success("PDF téléchargé");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue pendant la génération du PDF.";
      toast.error(message);
      window.alert(message);
    } finally {
      if (settings.autoIncrementInvoiceNumber) {
        incrementInvoiceNumber();
      }
      setIsExporting(false);
    }
  };

  const sendWhatsApp = () => {
    const title = docType === "devis" ? "DEVIS" : "FACTURE";
    const lines = items
      .filter((item) => item.description.trim())
      .map(
        (item) =>
          `• ${item.description} - ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.quantity * item.unitPrice)}`,
      )
      .join("\n");

    const message = [
      `${title} - ${today}`,
      `Client: ${clientName || "-"}`,
      `Téléphone client: ${clientPhone || "-"}`,
      lines,
      `Total HT: ${formatCurrency(totalHT)}`,
      ...(isVatEnabled ? [`TVA (${vatRate}%): ${formatCurrency(vatAmount)}`] : []),
      `Total: ${formatCurrency(totalTTC)}`,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="invoice-shell">
      <section
        className="invoice-container print:hidden"
        dir={isArabic ? "rtl" : "ltr"}
        style={{ fontFamily: isArabic ? '"Tajawal", "Cairo", sans-serif' : undefined }}
      >
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t.appTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t.appSubtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="inline-flex items-center rounded-md border border-border bg-background p-1"
              role="group"
              aria-label={t.languageToggle}
            >
              <Button type="button" size="sm" variant={language === "fr" ? "default" : "ghost"} onClick={() => setLanguage("fr")}>
                {t.languageFr}
              </Button>
              <Button type="button" size="sm" variant={language === "ar" ? "default" : "ghost"} onClick={() => setLanguage("ar")}>
                {t.languageAr}
              </Button>
            </div>

            <Dialog
              open={isSettingsOpen}
              onOpenChange={(open) => {
                setIsSettingsOpen(open);
                if (open) setSettingsDraft(settings);
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" aria-label={t.openSettings}>
                  <Settings />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t.settingsTitle}</DialogTitle>
                  <DialogDescription>{t.settingsDescription}</DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <Field label={t.invoicePrefixLabel}>
                    <Input
                      value={settingsDraft.invoicePrefix}
                      onChange={(e) => setSettingsDraft((prev) => ({ ...prev, invoicePrefix: e.target.value }))}
                      placeholder={t.invoicePrefixPlaceholder}
                    />
                  </Field>

                  <Field label={t.invoiceSequenceLabel}>
                    <Input
                      value={settingsDraft.invoiceSequence}
                      onChange={(e) => setSettingsDraft((prev) => ({ ...prev, invoiceSequence: e.target.value }))}
                      placeholder={t.invoiceSequencePlaceholder}
                    />
                  </Field>

                  <Field label={t.autoIncrementInvoiceNumberLabel}>
                    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <span className="text-sm text-foreground">{settingsDraft.autoIncrementInvoiceNumber ? "ON" : "OFF"}</span>
                      <Switch
                        checked={settingsDraft.autoIncrementInvoiceNumber}
                        onCheckedChange={(checked) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            autoIncrementInvoiceNumber: checked,
                          }))
                        }
                      />
                    </div>
                  </Field>

                </div>

                <Button type="button" onClick={saveSettings} className="w-full">
                  {t.save}
                </Button>
              </DialogContent>
            </Dialog>

            {onOpenSettings && (
              <Button type="button" variant="outline" size="sm" onClick={onOpenSettings}>
                <Settings /> {t.manageProfile}
              </Button>
            )}

            {onLogout && (
              <Button type="button" variant="outline" size="sm" onClick={onLogout}>
                <LogOut /> {t.logoutLabel}
              </Button>
            )}
          </div>
        </header>

        <div className="mt-6 grid gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <div className="invoice-card">
              <h2 className="invoice-section-title">Business Info</h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">{businessName}</p>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{businessAddress}</p>
                  <p className="text-sm text-muted-foreground">{businessPhone}</p>
                  {businessIce ? <p className="text-sm text-muted-foreground">ICE: {businessIce}</p> : null}
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md border border-border bg-background">
                  {businessLogoUrl ? (
                    <img src={businessLogoUrl} alt="Logo entreprise" className="h-full w-full rounded-md object-contain" loading="lazy" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Logo</span>
                  )}
                </div>
              </div>
            </div>

            <div className="invoice-card">
              <h2 className="invoice-section-title">{t.clientInfoTitle}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <Field label={t.clientNameLabel}>
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={t.clientNamePlaceholder} />
                  </Field>
                  <Field label={t.clientPhoneLabel}>
                    <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder={t.clientPhonePlaceholder} />
                  </Field>
                  <Field label={t.clientAddressLabel}>
                    <Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder={t.clientAddressPlaceholder} />
                  </Field>
                  <Field label={t.clientIceLabel}>
                    <Input value={clientIce} onChange={(e) => setClientIce(e.target.value)} placeholder={t.clientIcePlaceholder} />
                  </Field>
                </div>

                <div className="space-y-2 rounded-md border border-border bg-background p-3">
                  <label className="text-sm font-medium text-foreground">{t.documentTypeLabel}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={docType === "devis" ? "default" : "outline"}
                      onClick={() => setDocType("devis")}
                    >
                      {t.quoteLabel}
                    </Button>
                    <Button
                      type="button"
                      variant={docType === "facture" ? "default" : "outline"}
                      onClick={() => setDocType("facture")}
                    >
                      {t.invoiceLabel}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="invoice-card">
              <div className="flex items-center justify-between gap-3">
                <h2 className="invoice-section-title">{t.itemsTitle}</h2>
                <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, createItem()])}>
                  <Plus /> {t.addLine}
                </Button>
              </div>

              <div className="mt-4 overflow-hidden rounded-md border border-border">
                <div className="hidden grid-cols-12 border-b border-border bg-surface-soft px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-5">{t.descriptionLabel}</div>
                  <div className="col-span-2 text-center">{t.quantityLabel}</div>
                  <div className="col-span-2 text-center">{t.unitPriceLabel}</div>
                  <div className="col-span-2 text-center">{t.subtotalLabel}</div>
                </div>

                <div className="divide-y divide-border">
                  {items.map((item, index) => {
                    const lineTotal = item.quantity * item.unitPrice;
                    return (
                      <div key={item.id} className="grid grid-cols-1 gap-3 bg-background p-3 md:grid-cols-12 md:items-center md:gap-2">
                        <div className="flex items-center justify-between md:col-span-1 md:justify-center">
                          <span className="text-sm font-semibold text-foreground">{index + 1}</span>
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setItems((prev) => prev.filter((line) => line.id !== item.id))}
                              aria-label={t.deleteLine}
                              className="h-8 w-8 md:hidden"
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>

                        <div className="md:col-span-5">
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            placeholder={t.descriptionPlaceholder}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, { unitPrice: Math.max(0, Number(e.target.value) || 0) })}
                          />
                        </div>

                        <div className="flex items-center justify-between rounded-md border border-border bg-surface-soft px-3 py-2 md:col-span-2 md:justify-center">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:hidden">{t.subtotalLabel}</p>
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(lineTotal)}</p>
                        </div>

                        {items.length > 1 && (
                          <div className="hidden md:col-span-12 md:flex md:justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setItems((prev) => prev.filter((line) => line.id !== item.id))}
                              aria-label={t.deleteLine}
                              className="h-8"
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 xl:col-span-4">
            <div className="invoice-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span className="text-sm font-medium text-foreground">{t.applyVatLabel}</span>
                  <Switch checked={isVatEnabled} onCheckedChange={setIsVatEnabled} />
                </div>
                {isVatEnabled && (
                  <Field label={t.vatRateLabel}>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={vatRate}
                      onChange={(e) => setVatRate(Math.max(0, Number(e.target.value) || 0))}
                    />
                  </Field>
                )}
              </div>
            </div>

            <div className="invoice-total-card">
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t.totalHtLabel}</span>
                  <strong className="text-lg font-semibold text-foreground">{formatCurrency(totalHT)}</strong>
                </div>
                {isVatEnabled && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t.vatAmountLabel} ({vatRate}%)</span>
                    <strong className="text-lg font-semibold text-foreground">{formatCurrency(vatAmount)}</strong>
                  </div>
                )}
                <div className="mt-1 border-t border-border pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{isVatEnabled ? t.totalTtcLabel : t.totalGlobalLabel}</span>
                    <strong className="text-2xl font-semibold text-foreground">{formatCurrency(totalTTC)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="invoice-card print:hidden">
              <div className="grid grid-cols-1 gap-3">
                <Button type="button" className="h-11" onClick={generatePdf} disabled={isExporting}>
                  {isExporting ? <LoaderCircle className="animate-spin" /> : <FileText />}
                  {isExporting ? t.generatingPdfLabel : t.generatePdfLabel}
                </Button>
                <Button type="button" variant="secondary" className="h-11" onClick={sendWhatsApp}>
                  <MessageCircle /> {t.sendWhatsAppLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div aria-hidden="true" dir="ltr" style={{ fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif' }}>
        <div
          id="pdf-template"
          ref={pdfTemplateRef}
          className="absolute top-0 -left-[9999px] min-h-[1123px] w-[794px] bg-[#ffffff] px-10 py-9 text-[#111111]"
        >
          <header className="flex items-start justify-between gap-8">
            <div>
              <p className="mb-8 text-6xl font-normal uppercase tracking-tight text-[#111111]">{docType === "devis" ? "DEVIS" : "FACTURE"}</p>
            </div>

            <div className="flex min-h-32 min-w-40 flex-col items-end justify-start gap-4">
              {businessLogoUrl ? (
                <img src={businessLogoUrl} alt="Logo" className="h-32 w-auto object-contain" />
              ) : (
                <div className="flex h-32 w-40 items-center justify-center rounded-full border border-[#111111] text-xs font-medium text-[#111111]">
                  LOGO
                </div>
              )}

              <div className="flex gap-2">
                <span className="rounded-full border border-[#111111] px-4 py-1 text-sm font-medium text-[#111111]">
                  {docType === "devis" ? "Devis" : "Facture"} n°{formattedInvoiceNumber}
                </span>
                <span className="rounded-full border border-[#111111] px-4 py-1 text-sm font-medium text-[#111111]">{today}</span>
              </div>
            </div>
          </header>

          <hr className="my-8 border-t border-[#111111]" />

          <section className="mb-8 grid grid-cols-2 gap-6">
            <div className="border border-[#000000] bg-[#ffffff] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#111111]">Émetteur</p>
              <p className="mt-2 text-sm font-bold uppercase text-[#111111]">{businessName}</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[#111111]">{businessAddress}</p>
              <p className="mt-1 text-sm text-[#111111]">{businessPhone}</p>
              {businessIce ? <p className="mt-1 text-sm text-[#111111]">ICE: {businessIce}</p> : null}
            </div>

            <div className="border border-[#000000] bg-[#ffffff] p-4 text-right">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#111111]">Client</p>
              <p className="mt-2 text-sm font-bold uppercase text-[#111111]">{clientName || "-"}</p>
              <p className="mt-1 text-sm text-[#111111]">{clientPhone || "-"}</p>
              {clientAddress.trim() && <p className="mt-1 text-sm leading-relaxed text-[#111111]">{clientAddress}</p>}
              {clientIce.trim() && <p className="mt-1 text-sm text-[#111111]">ICE : {clientIce}</p>}
            </div>
          </section>

          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.08em] text-[#111111]">Détail des prestations</p>
            <p className="text-xs font-medium text-[#111111]">{items.length} ligne(s)</p>
          </div>

          <table className="w-full border-collapse border-[4px] border-[#000000]">
            <thead>
              <tr className="bg-[#000000] text-[#ffffff]">
                <th className="border-[3px] border-[#000000] p-3 text-center text-xs font-black uppercase tracking-wider text-[#ffffff]">Description</th>
                <th className="border-[3px] border-[#000000] p-3 text-center text-xs font-black uppercase tracking-wider text-[#ffffff]">Prix</th>
                <th className="border-[3px] border-[#000000] p-3 text-center text-xs font-black uppercase tracking-wider text-[#ffffff]">Quantité</th>
                <th className="border-[3px] border-[#000000] p-3 text-center text-xs font-black uppercase tracking-wider text-[#ffffff]">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`pdf-${item.id}`} className="bg-[#ffffff]">
                  <td className="break-all whitespace-normal border-[3px] border-[#000000] px-3 py-4 text-sm font-bold text-[#000000] break-words">{item.description || "-"}</td>
                  <td className="border-[3px] border-[#000000] px-3 py-4 text-center text-base font-black text-[#000000]">{formatCurrency(item.unitPrice)}</td>
                  <td className="border-[3px] border-[#000000] px-3 py-4 text-center text-sm font-black text-[#000000]">{item.quantity}</td>
                  <td className="border-[3px] border-[#000000] px-3 py-4 text-center text-base font-black text-[#000000]">{formatCurrency(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-5 flex justify-end">
            {isVatEnabled ? (
               <div className="w-80 border-2 border-[#000000] bg-[#ffffff] p-3 text-right">
                <div className="flex items-center justify-between text-[#111111]">
                  <span className="text-sm font-bold">Total HT</span>
                  <span className="text-sm font-bold">{formatCurrency(totalHT)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[#111111]">
                  <span className="text-sm font-bold">TVA ({vatRate}%)</span>
                  <span className="text-sm font-bold">{formatCurrency(vatAmount)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between bg-[#000000] p-3 text-[#ffffff]">
                  <span className="text-sm font-black">Total TTC</span>
                  <strong className="text-lg font-black">{formatCurrency(totalTTC)}</strong>
                </div>
              </div>
            ) : (
              <div className="w-80 border-2 border-[#000000] bg-[#ffffff] p-3">
                <div className="flex items-center justify-between bg-[#000000] p-3 text-[#ffffff]">
                  <span className="text-sm font-black">Total Global</span>
                  <strong className="text-lg font-black">{formatCurrency(totalHT)}</strong>
                </div>
              </div>
            )}
          </div>

          <p className="mt-8 text-sm font-semibold uppercase italic text-[#111111]">
            Arrêté le présent {docType === "devis" ? "DEVIS" : "FACTURE"} à la somme de : {amountInWords.toUpperCase()}.
          </p>

          <footer className="mt-10">
            <hr className="mb-2 border-t border-[#111111]" />
            <p className="text-xs font-bold text-[#111111]">Merci pour votre confiance</p>
          </footer>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function incrementSequence(value: string) {
  const match = value.match(/^(.*?)(\d+)$/);
  if (!match) return "00001";

  const [, prefix, digits] = match;
  const nextNumber = String(Number.parseInt(digits, 10) + 1).padStart(digits.length, "0");
  return `${prefix}${nextNumber}`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function toFrenchCurrencyWords(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value * 100) / 100) : 0;
  const dirhams = Math.floor(safeValue);
  const centimes = Math.round((safeValue - dirhams) * 100);

  const dirhamWords = toFrenchNumberWords(dirhams);
  const centimeWords = centimes > 0 ? toFrenchNumberWords(centimes) : "";

  if (centimes > 0) {
    return `${dirhamWords} Dirhams et ${centimeWords} Centimes`;
  }

  return `${dirhamWords} Dirhams`;
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

  if (remaining > 0) {
    words.push(threeDigits(remaining));
  }

  return words.join(" ").replace(/\s+/g, " ").trim();
}