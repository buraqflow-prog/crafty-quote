import type { AppLanguage } from "@/lib/ui-language";

export const uiDictionary: Record<
  AppLanguage,
  {
    navDashboard: string;
    navNew: string;
    navSettings: string;
    logout: string;
    logoutSuccess: string;
    logoutError: string;
    loading: string;
    dashboardTitle: string;
    dashboardSubtitle: string;
    newInvoice: string;
    totalTtc: string;
    totalDocuments: string;
    quotesVsInvoices: string;
    quotes: string;
    invoices: string;
    recentDocuments: string;
    noInvoicesYet: string;
    date: string;
    client: string;
    docNumber: string;
    type: string;
    total: string;
    actions: string;
    viewDocument: string;
    downloadPdf: string;
    loadDocumentsError: string;
    pdfGenerationError: string;
    language: string;
    languageUi: string;
    languageFr: string;
    languageAr: string;
    languageEn: string;
    profileSettingsTitle: string;
    profileSettingsSubtitle: string;
    back: string;
    loadingProfile: string;
    profileLoadError: string;
    profileUploadSuccess: string;
    profileUploadError: string;
    profileValidationError: string;
    profileSaveSuccess: string;
    profileSaveError: string;
    noLogo: string;
    saveChanges: string;
    companyName: string;
    phone: string;
    address: string;
    ice: string;
    logoCompany: string;
    remove: string;
    uploadInProgress: string;
  }
> = {
  fr: {
    navDashboard: "Tableau de bord",
    navNew: "Nouvelle",
    navSettings: "Paramètres",
    logout: "Déconnexion",
    logoutSuccess: "Déconnexion réussie",
    logoutError: "Impossible de se déconnecter",
    loading: "Chargement...",
    dashboardTitle: "Dashboard Artisan",
    dashboardSubtitle: "Suivi de vos devis et factures en temps réel.",
    newInvoice: "Nouvelle Facture",
    totalTtc: "Total TTC",
    totalDocuments: "Total Documents",
    quotesVsInvoices: "Devis vs Factures",
    quotes: "Devis",
    invoices: "Factures",
    recentDocuments: "Documents récents",
    noInvoicesYet: "Aucune facture pour le moment",
    date: "Date",
    client: "Client",
    docNumber: "N° Document",
    type: "Type",
    total: "Total",
    actions: "Actions",
    viewDocument: "Voir le document",
    downloadPdf: "Télécharger PDF",
    loadDocumentsError: "Impossible de charger les documents.",
    pdfGenerationError: "Impossible de générer le PDF pour ce document.",
    language: "Langue",
    languageUi: "Langue de l'interface",
    languageFr: "Fr",
    languageAr: "Ar",
    languageEn: "En",
    profileSettingsTitle: "Paramètres entreprise",
    profileSettingsSubtitle: "Gérez les informations utilisées dans vos devis et factures.",
    back: "Retour",
    loadingProfile: "Chargement du profil...",
    profileLoadError: "Impossible de charger votre profil.",
    profileUploadSuccess: "Logo téléversé avec succès.",
    profileUploadError: "Échec du téléversement du logo.",
    profileValidationError: "Veuillez vérifier les champs du formulaire.",
    profileSaveSuccess: "Profil mis à jour.",
    profileSaveError: "Impossible de sauvegarder le profil.",
    noLogo: "Aucun logo défini.",
    saveChanges: "Enregistrer les modifications",
    companyName: "Nom de l'entreprise",
    phone: "Téléphone",
    address: "Adresse",
    ice: "ICE",
    logoCompany: "Logo entreprise",
    remove: "Retirer",
    uploadInProgress: "Téléversement en cours...",
  },
  ar: {
    navDashboard: "لوحة التحكم",
    navNew: "جديد",
    navSettings: "الإعدادات",
    logout: "تسجيل الخروج",
    logoutSuccess: "تم تسجيل الخروج بنجاح",
    logoutError: "تعذر تسجيل الخروج",
    loading: "جاري التحميل...",
    dashboardTitle: "لوحة الحرفي",
    dashboardSubtitle: "متابعة عروض الأسعار والفواتير في الوقت الفعلي.",
    newInvoice: "فاتورة جديدة",
    totalTtc: "المجموع مع الضريبة",
    totalDocuments: "إجمالي المستندات",
    quotesVsInvoices: "عروض الأسعار مقابل الفواتير",
    quotes: "عروض",
    invoices: "فواتير",
    recentDocuments: "المستندات الأخيرة",
    noInvoicesYet: "لا توجد فواتير حالياً",
    date: "التاريخ",
    client: "العميل",
    docNumber: "رقم المستند",
    type: "النوع",
    total: "الإجمالي",
    actions: "إجراءات",
    viewDocument: "عرض المستند",
    downloadPdf: "تنزيل PDF",
    loadDocumentsError: "تعذر تحميل المستندات.",
    pdfGenerationError: "تعذر إنشاء ملف PDF لهذا المستند.",
    language: "اللغة",
    languageUi: "لغة الواجهة",
    languageFr: "فر",
    languageAr: "عر",
    languageEn: "إن",
    profileSettingsTitle: "إعدادات الشركة",
    profileSettingsSubtitle: "إدارة المعلومات المستخدمة في عروض الأسعار والفواتير.",
    back: "رجوع",
    loadingProfile: "جاري تحميل الملف الشخصي...",
    profileLoadError: "تعذر تحميل ملفك الشخصي.",
    profileUploadSuccess: "تم رفع الشعار بنجاح.",
    profileUploadError: "فشل رفع الشعار.",
    profileValidationError: "يرجى التحقق من الحقول.",
    profileSaveSuccess: "تم تحديث الملف الشخصي.",
    profileSaveError: "تعذر حفظ الملف الشخصي.",
    noLogo: "لا يوجد شعار.",
    saveChanges: "حفظ التغييرات",
    companyName: "اسم الشركة",
    phone: "الهاتف",
    address: "العنوان",
    ice: "رقم ICE",
    logoCompany: "شعار الشركة",
    remove: "إزالة",
    uploadInProgress: "جاري الرفع...",
  },
  en: {
    navDashboard: "Dashboard",
    navNew: "New",
    navSettings: "Settings",
    logout: "Logout",
    logoutSuccess: "Logged out successfully",
    logoutError: "Unable to log out",
    loading: "Loading...",
    dashboardTitle: "Artisan Dashboard",
    dashboardSubtitle: "Track your quotes and invoices in real time.",
    newInvoice: "New Invoice",
    totalTtc: "Total incl. VAT",
    totalDocuments: "Total Documents",
    quotesVsInvoices: "Quotes vs Invoices",
    quotes: "Quotes",
    invoices: "Invoices",
    recentDocuments: "Recent documents",
    noInvoicesYet: "No invoices yet",
    date: "Date",
    client: "Client",
    docNumber: "Doc No.",
    type: "Type",
    total: "Total",
    actions: "Actions",
    viewDocument: "View document",
    downloadPdf: "Download PDF",
    loadDocumentsError: "Unable to load documents.",
    pdfGenerationError: "Unable to generate PDF for this document.",
    language: "Language",
    languageUi: "UI language",
    languageFr: "Fr",
    languageAr: "Ar",
    languageEn: "En",
    profileSettingsTitle: "Business settings",
    profileSettingsSubtitle: "Manage information used in your quotes and invoices.",
    back: "Back",
    loadingProfile: "Loading profile...",
    profileLoadError: "Unable to load your profile.",
    profileUploadSuccess: "Logo uploaded successfully.",
    profileUploadError: "Logo upload failed.",
    profileValidationError: "Please check form fields.",
    profileSaveSuccess: "Profile updated.",
    profileSaveError: "Unable to save profile.",
    noLogo: "No logo set.",
    saveChanges: "Save changes",
    companyName: "Company name",
    phone: "Phone",
    address: "Address",
    ice: "ICE",
    logoCompany: "Company logo",
    remove: "Remove",
    uploadInProgress: "Uploading...",
  },
};