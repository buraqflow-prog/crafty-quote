import { useMemo, useState } from "react";
import { Settings, Plus, Trash2, FileText, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type DocumentType = "devis" | "facture";

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

export function QuoteInvoiceApp() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>(() => {
    if (typeof window === "undefined") return emptySettings;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySettings;
    try {
      return { ...emptySettings, ...(JSON.parse(raw) as Partial<BusinessSettings>) };
    } catch {
      return emptySettings;
    }
  });
  const [settingsDraft, setSettingsDraft] = useState<BusinessSettings>(settings);

  const [docType, setDocType] = useState<DocumentType>("devis");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([createItem()]);

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

  const generatePdf = () => {
    window.print();
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
      <section className="invoice-container print:hidden">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Devis / Facture</h1>
            <p className="mt-1 text-sm text-muted-foreground">Générateur élégant pour artisans</p>
          </div>

          <Dialog
            open={isSettingsOpen}
            onOpenChange={(open) => {
              setIsSettingsOpen(open);
              if (open) setSettingsDraft(settings);
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Ouvrir les paramètres">
                <Settings />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Paramètres entreprise</DialogTitle>
                <DialogDescription>
                  Ces informations sont enregistrées uniquement dans votre navigateur.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <Field label="Nom de l'entreprise">
                  <Input
                    value={settingsDraft.companyName}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Atelier Exemple"
                  />
                </Field>

                <Field label="Adresse">
                  <Textarea
                    value={settingsDraft.address}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Adresse complète"
                  />
                </Field>

                <Field label="Téléphone">
                  <Input
                    value={settingsDraft.phone}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="06XXXXXXXX"
                  />
                </Field>

                <Field label="ICE (Optionnel)">
                  <Input
                    value={settingsDraft.ice}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, ice: e.target.value }))}
                    placeholder="Numéro ICE"
                  />
                </Field>

                <Field label="Logo">
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
                        Retirer
                      </Button>
                    </div>
                  )}
                </Field>
              </div>

              <Button type="button" onClick={saveSettings} className="w-full">
                Enregistrer
              </Button>
            </DialogContent>
          </Dialog>
        </header>

        <div className="mt-6 space-y-4">
          <div className="invoice-card">
            <h2 className="invoice-section-title">Informations client</h2>
            <div className="mt-3 grid gap-3">
              <Field label="Nom du Client">
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nom complet" />
              </Field>
              <Field label="Téléphone du Client">
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="06XXXXXXXX" />
              </Field>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Type de document</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={docType === "devis" ? "default" : "outline"}
                    onClick={() => setDocType("devis")}
                  >
                    Devis
                  </Button>
                  <Button
                    type="button"
                    variant={docType === "facture" ? "default" : "outline"}
                    onClick={() => setDocType("facture")}
                  >
                    Facture
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="invoice-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="invoice-section-title">Services / Articles</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, createItem()])}>
                <Plus /> Ajouter
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {items.map((item, index) => {
                const lineTotal = item.quantity * item.unitPrice;
                return (
                  <div key={item.id} className="invoice-item-card">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Ligne {index + 1}</span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setItems((prev) => prev.filter((line) => line.id !== item.id))}
                          aria-label="Supprimer la ligne"
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>

                    <Field label="Description">
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder="Ex: Installation électrique"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Quantité">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 1 })}
                        />
                      </Field>

                      <Field label="Prix Unitaire">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) || 0 })}
                        />
                      </Field>
                    </div>

                    <div className="invoice-line-total">Sous-total: {formatCurrency(lineTotal)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="invoice-total-card">
            <span className="text-sm text-muted-foreground">Total Global</span>
            <strong className="text-2xl font-semibold text-foreground">{formatCurrency(grandTotal)}</strong>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button type="button" className="h-11" onClick={generatePdf}>
              <FileText /> Générer le PDF
            </Button>
            <Button type="button" variant="secondary" className="h-11" onClick={sendWhatsApp}>
              <MessageCircle /> Envoyer par WhatsApp
            </Button>
          </div>
        </div>
      </section>

      <div className="hidden print:block" aria-hidden="true">
        <div className="pdf-sheet print:mx-auto print:min-h-0 print:w-full print:max-w-[210mm] print:px-8 print:py-6">
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

          <table className="pdf-table">
            <thead>
              <tr className="pdf-table-head">
                <th>Description</th>
                <th>Qté</th>
                <th>Prix Unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`pdf-${item.id}`}>
                  <td>{item.description || "-"}</td>
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