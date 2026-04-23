import { useEffect, useMemo, useRef, useState } from "react";
import { Settings, Plus, Trash2, FileText, MessageCircle, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type DocumentType = "devis" | "facture";
type UILanguage = "fr" | "ar";

type BusinessSettings = {
  companyName: string;
  address: string;
  phone: string;
  ice: string;
  logoDataUrl: string;
};

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

const STORAGE_KEY = "craftsman_invoice_settings_v1";

const emptySettings: BusinessSettings = {
  companyName: "",
  address: "",
  phone: "",
  ice: "",
  logoDataUrl: "",
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
    settingsTitle: "Paramètres entreprise",
    settingsDescription: "Ces informations sont enregistrées uniquement dans votre navigateur.",
    companyNameLabel: "Nom de l'entreprise",
    companyNamePlaceholder: "Atelier Exemple",
    addressLabel: "Adresse",
    addressPlaceholder: "Adresse complète",
    phoneLabel: "Téléphone",
    phonePlaceholder: "06XXXXXXXX",
    iceLabel: "ICE (Optionnel)",
    icePlaceholder: "Numéro ICE",
    logoLabel: "Logo",
    removeLogo: "Retirer",
    save: "Enregistrer",
    clientInfoTitle: "Informations client",
    clientNameLabel: "Nom du Client",
    clientNamePlaceholder: "Nom complet",
    clientPhoneLabel: "Téléphone du Client",
    clientPhonePlaceholder: "06XXXXXXXX",
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
    generatePdfLabel: "Générer le PDF",
    generatingPdfLabel: "Génération en cours...",
    sendWhatsAppLabel: "Envoyer par WhatsApp",
  },
  ar: {
    appTitle: "عرض سعر / فاتورة",
    appSubtitle: "مولّد أنيق للحرفيين",
    languageToggle: "تغيير اللغة",
    languageFr: "Fr",
    languageAr: "Ar",
    openSettings: "الإعدادات",
    settingsTitle: "إعدادات الشركة",
    settingsDescription: "يتم حفظ هذه المعلومات فقط داخل متصفحك.",
    companyNameLabel: "اسم الشركة",
    companyNamePlaceholder: "ورشة المثال",
    addressLabel: "العنوان",
    addressPlaceholder: "العنوان الكامل",
    phoneLabel: "رقم الهاتف",
    phonePlaceholder: "06XXXXXXXX",
    iceLabel: "ICE (اختياري)",
    icePlaceholder: "رقم ICE",
    logoLabel: "الشعار",
    removeLogo: "حذف",
    save: "حفظ",
    clientInfoTitle: "معلومات الزبون",
    clientNameLabel: "اسم الزبون",
    clientNamePlaceholder: "الاسم الكامل",
    clientPhoneLabel: "هاتف الزبون",
    clientPhonePlaceholder: "06XXXXXXXX",
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
    generatePdfLabel: "إنشاء الفاتورة",
    generatingPdfLabel: "جاري الإنشاء...",
    sendWhatsAppLabel: "إرسال عبر واتساب",
  },
} as const;

export function QuoteInvoiceApp() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>(emptySettings);
  const [settingsDraft, setSettingsDraft] = useState<BusinessSettings>(settings);
  const [language, setLanguage] = useState<UILanguage>("fr");

  const [docType, setDocType] = useState<DocumentType>("devis");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([createItem()]);
  const [isExporting, setIsExporting] = useState(false);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);
  const isArabic = language === "ar";
  const t = uiText[language];

  useEffect(() => {
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
  }, []);

  const today = new Date().toLocaleDateString("fr-FR");

  const grandTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items],
  );

  const saveSettings = () => {
    setSettings(settingsDraft);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsDraft));
    setIsSettingsOpen(false);
  };

  const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleLogoUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSettingsDraft((prev) => ({ ...prev, logoDataUrl: String(reader.result ?? "") }));
    };
    reader.readAsDataURL(file);
  };

  const generatePdf = async () => {
    if (isExporting || !pdfTemplateRef.current) return;

    setIsExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

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

      const imageData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const imgProps = pdf.getImageProperties(imageData);
      const ratio = Math.min(maxWidth / imgProps.width, maxHeight / imgProps.height);
      const width = imgProps.width * ratio;
      const height = imgProps.height * ratio;
      const x = (pageWidth - width) / 2;

      pdf.addImage(imageData, "JPEG", x, margin, width, height);

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
      `Total: ${formatCurrency(grandTotal)}`,
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
                  <Field label={t.companyNameLabel}>
                    <Input
                      value={settingsDraft.companyName}
                      onChange={(e) => setSettingsDraft((prev) => ({ ...prev, companyName: e.target.value }))}
                      placeholder={t.companyNamePlaceholder}
                    />
                  </Field>

                  <Field label={t.addressLabel}>
                    <Textarea
                      value={settingsDraft.address}
                      onChange={(e) => setSettingsDraft((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder={t.addressPlaceholder}
                    />
                  </Field>

                  <Field label={t.phoneLabel}>
                    <Input
                      value={settingsDraft.phone}
                      onChange={(e) => setSettingsDraft((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder={t.phonePlaceholder}
                    />
                  </Field>

                  <Field label={t.iceLabel}>
                    <Input
                      value={settingsDraft.ice}
                      onChange={(e) => setSettingsDraft((prev) => ({ ...prev, ice: e.target.value }))}
                      placeholder={t.icePlaceholder}
                    />
                  </Field>

                  <Field label={t.logoLabel}>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                    />
                    {settingsDraft.logoDataUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={settingsDraft.logoDataUrl} alt="Logo entreprise" className="h-10 w-10 rounded-sm object-contain ring-1 ring-border" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSettingsDraft((prev) => ({ ...prev, logoDataUrl: "" }))}
                        >
                          {t.removeLogo}
                        </Button>
                      </div>
                    )}
                  </Field>
                </div>

                <Button type="button" onClick={saveSettings} className="w-full">
                  {t.save}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="mt-6 space-y-4">
          <div className="invoice-card">
            <h2 className="invoice-section-title">{t.clientInfoTitle}</h2>
            <div className="mt-3 grid gap-3">
              <Field label={t.clientNameLabel}>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={t.clientNamePlaceholder} />
              </Field>
              <Field label={t.clientPhoneLabel}>
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder={t.clientPhonePlaceholder} />
              </Field>

              <div className="space-y-2">
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

            <div className="mt-4 space-y-3">
              {items.map((item, index) => {
                const lineTotal = item.quantity * item.unitPrice;
                return (
                  <div key={item.id} className="invoice-item-card">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{t.lineLabel} {index + 1}</span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setItems((prev) => prev.filter((line) => line.id !== item.id))}
                          aria-label={t.deleteLine}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>

                    <Field label={t.descriptionLabel}>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder={t.descriptionPlaceholder}
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t.quantityLabel}>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 1 })}
                        />
                      </Field>

                      <Field label={t.unitPriceLabel}>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) || 0 })}
                        />
                      </Field>
                    </div>

                    <div className="invoice-line-total">{t.subtotalLabel}: {formatCurrency(lineTotal)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="invoice-total-card">
            <span className="text-sm text-muted-foreground">{t.totalGlobalLabel}</span>
            <strong className="text-2xl font-semibold text-foreground">{formatCurrency(grandTotal)}</strong>
          </div>

          <div className="grid grid-cols-1 gap-3 print:hidden sm:grid-cols-2">
            <Button type="button" className="h-11" onClick={generatePdf} disabled={isExporting}>
              {isExporting ? <LoaderCircle className="animate-spin" /> : <FileText />}
              {isExporting ? t.generatingPdfLabel : t.generatePdfLabel}
            </Button>
            <Button type="button" variant="secondary" className="h-11" onClick={sendWhatsApp}>
              <MessageCircle /> {t.sendWhatsAppLabel}
            </Button>
          </div>
        </div>
      </section>

      <div aria-hidden="true" dir="ltr" style={{ fontFamily: '"Inter", sans-serif' }}>
        <div
          id="pdf-template"
          ref={pdfTemplateRef}
          className="pdf-sheet absolute top-0 -left-[9999px] min-h-[1123px] w-[794px] bg-white px-8 py-6"
        >
          <header className="pdf-header">
            <div>
              {settings.logoDataUrl ? (
                <img src={settings.logoDataUrl} alt="Logo" className="h-16 max-w-[180px] object-contain" />
              ) : (
                <div className="pdf-logo-placeholder">LOGO</div>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-lg font-semibold">{settings.companyName || "Votre entreprise"}</h2>
              <p className="pdf-business-text mt-1 whitespace-pre-line">{settings.address || "Adresse"}</p>
              <p className="pdf-business-text">Tél: {settings.phone || "-"}</p>
              {settings.ice && <p className="pdf-business-text">ICE: {settings.ice}</p>}
            </div>
          </header>

          <section className="pdf-doc-head">
            <div>
              <p className="pdf-doc-label">Document</p>
              <p className="text-2xl font-semibold tracking-tight">{docType === "devis" ? "DEVIS" : "FACTURE"}</p>
            </div>
            <div className="pdf-meta-block">
              <p>Date: {today}</p>
              <p className="mt-1">Client: {clientName || "-"}</p>
              <p>Tél Client: {clientPhone || "-"}</p>
            </div>
          </section>

          <table className="pdf-table table-fixed w-full">
            <thead>
              <tr className="pdf-table-head">
                <th className="w-[55%]">Description</th>
                <th className="w-[15%]">Qté</th>
                <th className="w-[15%]">Prix Unitaire</th>
                <th className="w-[15%]">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`pdf-${item.id}`}>
                  <td className="break-words whitespace-normal break-all">{item.description || "-"}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pdf-grand-total">
            <span>Total Global</span>
            <strong>{formatCurrency(grandTotal)}</strong>
          </div>

          <footer className="pdf-footer">Merci pour votre confiance.</footer>
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 2,
  }).format(amount);
}