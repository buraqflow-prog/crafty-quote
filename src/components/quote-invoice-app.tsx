import { useEffect, useMemo, useState } from "react";
import { Settings, Plus, Trash2, FileText, MessageCircle, LoaderCircle, LogOut, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { uiDictionary } from "@/lib/ui-i18n";
import { enqueueOfflineInvoice, saveInvoiceOnline, type InvoicePayload } from "@/lib/offline-invoice-sync";
import type { UserProfile } from "@/lib/profile";
import { useUiLanguage, type AppLanguage } from "@/lib/ui-language";

type DocumentType = "devis" | "facture";

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
const DRAFT_STORAGE_KEY = "craftsman_invoice_draft_v1";

type InvoiceDraft = {
  uiLanguage: AppLanguage;
  invoiceContentLanguage: "fr" | "en";
  docType: DocumentType;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  clientIce: string;
  items: InvoiceItem[];
  isVatEnabled: boolean;
  vatRate: number;
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
    closing: "Arrêté le présent",
    sum: "à la somme de",
    thanks: "Merci pour votre confiance",
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
    closing: "This",
    sum: "is set at",
    thanks: "Thank you for your trust",
  },
} as const;

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
    languageEn: "En",
    invoiceContentLanguageLabel: "Langue de la facture",
    openSettings: "Ouvrir les paramètres",
    manageProfile: "Profil",
    backLabel: "Retour",
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
    saveInvoiceLabel: "Enregistrer",
    logoutLabel: "Déconnexion",
    networkOnline: "En ligne",
    networkOffline: "Hors ligne",
  },
  ar: {
    appTitle: "عرض سعر / فاتورة",
    appSubtitle: "مولّد أنيق للحرفيين",
    languageToggle: "تغيير اللغة",
    languageFr: "Fr",
    languageAr: "Ar",
    languageEn: "En",
    invoiceContentLanguageLabel: "لغة الفاتورة",
    openSettings: "الإعدادات",
    manageProfile: "الملف",
    backLabel: "رجوع",
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
    saveInvoiceLabel: "حفظ",
    logoutLabel: "تسجيل الخروج",
    networkOnline: "متصل",
    networkOffline: "غير متصل",
  },
  en: {
    appTitle: "Quote / Invoice",
    appSubtitle: "Elegant generator for artisans",
    languageToggle: "Change language",
    languageFr: "Fr",
    languageAr: "Ar",
    languageEn: "En",
    invoiceContentLanguageLabel: "Invoice language",
    openSettings: "Open settings",
    manageProfile: "Profile",
    backLabel: "Back",
    settingsTitle: "Business settings",
    settingsDescription: "Numbering settings are saved locally.",
    invoicePrefixLabel: "Quote / Invoice prefix",
    invoicePrefixPlaceholder: "FAC-",
    invoiceSequenceLabel: "Numbering",
    invoiceSequencePlaceholder: "00012",
    autoIncrementInvoiceNumberLabel: "Auto increment when clicking Generate PDF",
    save: "Save",
    clientInfoTitle: "Client information",
    clientNameLabel: "Client name",
    clientNamePlaceholder: "Full name",
    clientPhoneLabel: "Client phone",
    clientPhonePlaceholder: "06XXXXXXXX",
    clientAddressLabel: "Client address (Optional)",
    clientAddressPlaceholder: "Client address",
    clientIceLabel: "Client ICE (Optional)",
    clientIcePlaceholder: "Client ICE number",
    documentTypeLabel: "Document type",
    quoteLabel: "Quote",
    invoiceLabel: "Invoice",
    itemsTitle: "Services / Items",
    addLine: "Add",
    lineLabel: "Line",
    deleteLine: "Delete line",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Ex: Electrical installation",
    quantityLabel: "Quantity",
    unitPriceLabel: "Unit price",
    subtotalLabel: "Subtotal",
    totalGlobalLabel: "Global total",
    applyVatLabel: "Apply VAT",
    vatRateLabel: "VAT rate (%)",
    totalHtLabel: "Total excl. VAT",
    vatAmountLabel: "VAT amount",
    totalTtcLabel: "Total incl. VAT",
    generatePdfLabel: "Generate PDF",
    generatingPdfLabel: "Generating...",
    sendWhatsAppLabel: "Send via WhatsApp",
    saveInvoiceLabel: "Save",
    logoutLabel: "Logout",
    networkOnline: "Online",
    networkOffline: "Offline",
  },
} as const;

export function QuoteInvoiceApp({
  onLogout,
  onBack,
  onOpenSettings,
  profile,
  userId,
}: {
  onLogout?: () => void | Promise<void>;
  onBack?: () => void;
  onOpenSettings?: () => void;
  profile?: UserProfile | null;
  userId: string;
}) {
  const { uiLanguage, setUiLanguage } = useUiLanguage();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>(emptySettings);
  const [settingsDraft, setSettingsDraft] = useState<BusinessSettings>(settings);
  const [invoiceContentLanguage, setInvoiceContentLanguage] = useState<"fr" | "en">("fr");

  const [docType, setDocType] = useState<DocumentType>("devis");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientIce, setClientIce] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([createItem()]);
  const [isVatEnabled, setIsVatEnabled] = useState(false);
  const [vatRate, setVatRate] = useState(20);
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const isUiArabic = uiLanguage === "ar";
  const t = uiText[uiLanguage];
  const uiT = uiDictionary[uiLanguage];
  const pdfT = invoicePdfText[invoiceContentLanguage];
  const canUseLocalStorage = typeof window !== "undefined";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateNetwork = () => setIsOnline(window.navigator.onLine);
    updateNetwork();
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);

    return () => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
    };
  }, []);

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

  useEffect(() => {
    if (!canUseLocalStorage) return;

    const rawDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft) as Partial<InvoiceDraft>;
      setInvoiceContentLanguage(draft.invoiceContentLanguage === "en" ? "en" : "fr");
      setDocType(draft.docType === "facture" ? "facture" : "devis");
      setClientName(typeof draft.clientName === "string" ? draft.clientName : "");
      setClientPhone(typeof draft.clientPhone === "string" ? draft.clientPhone : "");
      setClientAddress(typeof draft.clientAddress === "string" ? draft.clientAddress : "");
      setClientIce(typeof draft.clientIce === "string" ? draft.clientIce : "");
      setIsVatEnabled(Boolean(draft.isVatEnabled));
      setVatRate(typeof draft.vatRate === "number" ? draft.vatRate : 20);

      if (Array.isArray(draft.items) && draft.items.length > 0) {
        const normalizedItems = draft.items.map((item) => ({
          id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
          description: typeof item.description === "string" ? item.description : "",
          quantity: typeof item.quantity === "number" ? Math.max(1, item.quantity) : 1,
          unitPrice: typeof item.unitPrice === "number" ? Math.max(0, item.unitPrice) : 0,
        }));
        setItems(normalizedItems);
      }
    } catch {
      // ignore corrupted draft
    }
  }, [canUseLocalStorage]);

  useEffect(() => {
    if (!canUseLocalStorage) return;

    const draft: InvoiceDraft = {
      uiLanguage,
      invoiceContentLanguage,
      docType,
      clientName,
      clientPhone,
      clientAddress,
      clientIce,
      items,
      isVatEnabled,
      vatRate,
    };

    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [canUseLocalStorage, clientAddress, clientIce, clientName, clientPhone, docType, invoiceContentLanguage, isVatEnabled, items, uiLanguage, vatRate]);

  const today = new Date().toLocaleDateString("fr-FR");
  const formattedInvoiceNumber = `${settings.invoicePrefix || "FAC-"}${settings.invoiceSequence || "00012"}`;

  const totalHT = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items],
  );
  const vatAmount = useMemo(() => (isVatEnabled ? totalHT * (vatRate / 100) : 0), [isVatEnabled, totalHT, vatRate]);
  const totalTTC = useMemo(() => totalHT + vatAmount, [totalHT, vatAmount]);

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

  const businessName = profile?.business_name?.trim() || uiT.defaultBusinessName;
  const businessAddress = profile?.address?.trim() || uiT.defaultBusinessAddress;
  const businessPhone = profile?.phone?.trim() || "-";
  const businessIce = profile?.ice_number?.trim() || "";
  const businessLogoUrl = profile?.logo_url?.trim() || "";

  const buildInvoicePayload = (): InvoicePayload => ({
    documentType: docType,
    invoiceNumber: formattedInvoiceNumber,
    clientName,
    clientPhone,
    clientAddress,
    clientIce,
    items: items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    totalHT,
    vatRate,
    totalTTC,
    isVatEnabled,
    issuedAt: new Date().toISOString(),
    fullState: {
      uiLanguage,
      invoiceContentLanguage,
      documentType: docType,
      invoiceNumber: formattedInvoiceNumber,
      client: {
        name: clientName,
        phone: clientPhone,
        address: clientAddress,
        ice: clientIce,
      },
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice,
      })),
      totals: {
        totalHT,
        vatRate,
        vatAmount,
        totalTTC,
        isVatEnabled,
      },
      issuedAt: new Date().toISOString(),
      settings: {
        invoicePrefix: settings.invoicePrefix,
        invoiceSequence: settings.invoiceSequence,
        autoIncrementInvoiceNumber: settings.autoIncrementInvoiceNumber,
      },
      businessProfile: {
        businessName,
        businessAddress,
        businessPhone,
        businessIce,
        businessLogoUrl,
      },
    },
  });

  const generatePdf = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const payload = buildInvoicePayload();
      await downloadInvoicePdf({
        invoiceId: payload.invoiceNumber,
        payload,
        fallback: {
          documentType: payload.documentType,
          invoiceNumber: payload.invoiceNumber,
          clientName: payload.clientName,
          issuedAt: payload.issuedAt,
          totalTtc: payload.totalTTC,
        },
      });
      toast.success(uiT.pdfDownloaded);
    } catch {
      const message = uiT.pdfUnknownError;
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
    const title = docType === "devis" ? pdfT.quote : pdfT.invoice;
    const lines = items
      .filter((item) => item.description.trim())
      .map(
        (item) =>
          `• ${item.description} - ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.quantity * item.unitPrice)}`,
      )
      .join("\n");

    const message = [
      `${title} - ${today}`,
      `${uiT.whatsappClient}: ${clientName || "-"}`,
      `${uiT.whatsappClientPhone}: ${clientPhone || "-"}`,
      lines,
      `${pdfT.totalHt}: ${formatCurrency(totalHT)}`,
      ...(isVatEnabled ? [`${pdfT.totalVat} (${vatRate}%): ${formatCurrency(vatAmount)}`] : []),
      `${pdfT.total}: ${formatCurrency(totalTTC)}`,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const saveInvoice = async () => {
    if (isSavingInvoice) return;

    const payload = buildInvoicePayload();

    setIsSavingInvoice(true);
    try {
      const online = typeof navigator !== "undefined" ? navigator.onLine : true;

      if (online) {
        await saveInvoiceOnline(userId, payload);
        toast.success(uiT.documentSavedSuccess);
      } else {
        if (typeof window !== "undefined") {
          enqueueOfflineInvoice(userId, payload);
        }
        toast(uiT.offlineQueued);
      }
    } catch {
      toast.error(uiT.documentSaveError);
    } finally {
      setIsSavingInvoice(false);
    }
  };

  return (
    <main className="invoice-shell">
      <section
        className="invoice-container print:hidden"
        dir={isUiArabic ? "rtl" : "ltr"}
        style={{ fontFamily: isUiArabic ? '"Tajawal", "Cairo", sans-serif' : undefined }}
      >
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t.appTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t.appSubtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="sr-only">{isOnline ? t.networkOnline : t.networkOffline}</span>

            <div
              className="inline-flex items-center rounded-md border border-border bg-background p-1"
              role="group"
              aria-label={t.languageToggle}
            >
              <Button type="button" size="sm" variant={uiLanguage === "fr" ? "default" : "ghost"} onClick={() => setUiLanguage("fr")}>
                {t.languageFr}
              </Button>
              <Button type="button" size="sm" variant={uiLanguage === "ar" ? "default" : "ghost"} onClick={() => setUiLanguage("ar")}>
                {t.languageAr}
              </Button>
              <Button type="button" size="sm" variant={uiLanguage === "en" ? "default" : "ghost"} onClick={() => setUiLanguage("en")}>
                {t.languageEn}
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
              <Button type="button" variant="outline" size="sm" onClick={onOpenSettings} className="hidden md:inline-flex">
                <Settings /> {t.manageProfile}
              </Button>
            )}

            {onBack && (
              <Button type="button" variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft /> {t.backLabel}
              </Button>
            )}

            {onLogout && (
              <Button type="button" variant="outline" size="sm" onClick={onLogout}>
                <LogOut /> {t.logoutLabel}
              </Button>
            )}
          </div>
        </header>

        {onOpenSettings && (
          <div className="mt-3 md:hidden">
            <Button type="button" variant="outline" className="h-10 w-full" onClick={onOpenSettings}>
              <Settings /> {t.manageProfile}
            </Button>
          </div>
        )}

        <div className="mt-6 grid gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <div className="invoice-card">
              <h2 className="invoice-section-title">{uiT.businessInfoTitle}</h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">{businessName}</p>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{businessAddress}</p>
                  <p className="text-sm text-muted-foreground">{businessPhone}</p>
                  {businessIce ? <p className="text-sm text-muted-foreground">{uiT.businessIceLabel}: {businessIce}</p> : null}
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md border border-border bg-background">
                  {businessLogoUrl ? (
                    <img src={businessLogoUrl} alt={uiT.profileLogoAlt} className="h-full w-full rounded-md object-contain" loading="lazy" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{uiT.logoFallback}</span>
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

                  <div className="mt-3 space-y-2">
                    <label className="text-sm font-medium text-foreground">{t.invoiceContentLanguageLabel}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button type="button" size="sm" variant={invoiceContentLanguage === "fr" ? "default" : "outline"} onClick={() => setInvoiceContentLanguage("fr")}>{t.languageFr}</Button>
                      <Button type="button" size="sm" variant={invoiceContentLanguage === "en" ? "default" : "outline"} onClick={() => setInvoiceContentLanguage("en")}>{t.languageEn}</Button>
                    </div>
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
                <Button type="button" variant="outline" className="h-11" onClick={saveInvoice} disabled={isSavingInvoice}>
                  {isSavingInvoice ? <LoaderCircle className="animate-spin" /> : <Save />}
                  {t.saveInvoiceLabel}
                </Button>
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