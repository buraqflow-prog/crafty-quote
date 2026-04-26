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
    syncSuccess: string;
    businessInfoTitle: string;
    businessIceLabel: string;
    logoFallback: string;
    profileLogoAlt: string;
    pdfLogoAlt: string;
    defaultBusinessName: string;
    defaultBusinessAddress: string;
    pdfReadyShare: string;
    pdfDownloaded: string;
    shareUnavailableDownloadStarted: string;
    pdfUnknownError: string;
    documentSavedSuccess: string;
    offlineQueued: string;
    documentSaveError: string;
    whatsappClient: string;
    whatsappClientPhone: string;
    authBrand: string;
    authTitle: string;
    authDescription: string;
    authLogin: string;
    authSignup: string;
    authLoginTitle: string;
    authSignupTitle: string;
    authLoginSubtitle: string;
    authSignupSubtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    authLoginSuccess: string;
    authSignupVerifySuccess: string;
    authSignupSuccess: string;
    authInvalidCreds: string;
    authEmailNotConfirmed: string;
    authEmailUsed: string;
    authUnexpectedError: string;
    pageNotFoundTitle: string;
    pageNotFoundDescription: string;
    goHome: string;
    somethingWrong: string;
    unexpectedErrorTryAgain: string;
    tryAgain: string;
    companyNamePlaceholder: string;
    phonePlaceholder: string;
    addressPlaceholder: string;
    icePlaceholder: string;
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
    syncSuccess: "Synchronisation réussie !",
    businessInfoTitle: "Informations entreprise",
    businessIceLabel: "ICE",
    logoFallback: "Logo",
    profileLogoAlt: "Logo entreprise",
    pdfLogoAlt: "Logo",
    defaultBusinessName: "Votre entreprise",
    defaultBusinessAddress: "Adresse",
    pdfReadyShare: "PDF prêt à être partagé",
    pdfDownloaded: "PDF téléchargé",
    shareUnavailableDownloadStarted: "Partage indisponible, téléchargement lancé.",
    pdfUnknownError: "Erreur inconnue pendant la génération du PDF.",
    documentSavedSuccess: "Document enregistré avec succès",
    offlineQueued: "Mode hors-ligne : document ajouté à la file locale.",
    documentSaveError: "Erreur lors de l'enregistrement du document",
    whatsappClient: "Client",
    whatsappClientPhone: "Téléphone client",
    authBrand: "Craftsman SaaS",
    authTitle: "Authentification sécurisée",
    authDescription: "Gérez vos devis et factures en toute sécurité avec une expérience simple et professionnelle.",
    authLogin: "Se connecter",
    authSignup: "Créer un compte",
    authLoginTitle: "Se connecter",
    authSignupTitle: "Créer un compte",
    authLoginSubtitle: "Accédez à votre espace de facturation.",
    authSignupSubtitle: "Créez votre compte artisan en quelques secondes.",
    emailLabel: "Email",
    emailPlaceholder: "vous@exemple.com",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "••••••••",
    authLoginSuccess: "Connexion réussie",
    authSignupVerifySuccess: "Compte créé. Vérifiez votre email pour activer votre accès.",
    authSignupSuccess: "Compte créé et connecté.",
    authInvalidCreds: "Identifiants invalides.",
    authEmailNotConfirmed: "Veuillez confirmer votre email avant de vous connecter.",
    authEmailUsed: "Cet email est déjà utilisé.",
    authUnexpectedError: "Une erreur est survenue. Veuillez réessayer.",
    pageNotFoundTitle: "Page non trouvée",
    pageNotFoundDescription: "La page recherchée n'existe pas ou a été déplacée.",
    goHome: "Accueil",
    somethingWrong: "Une erreur est survenue",
    unexpectedErrorTryAgain: "Une erreur inattendue est survenue. Veuillez réessayer.",
    tryAgain: "Réessayer",
    companyNamePlaceholder: "Atelier Exemple",
    phonePlaceholder: "06XXXXXXXX",
    addressPlaceholder: "Adresse complète",
    icePlaceholder: "Numéro ICE",
  },
  ar: {
    navDashboard: "لوحة التحكم",
    navNew: "جديد",
    navSettings: "الإعدادات",
    logout: "تسجيل الخروج",
    logoutSuccess: "تم تسجيل الخروج بنجاح",
    logoutError: "تعذر تسجيل الخروج",
    loading: "جاري التحميل...",
    dashboardTitle: "لوحة التحكم",
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
    syncSuccess: "تمت المزامنة بنجاح!",
    businessInfoTitle: "معلومات الشركة",
    businessIceLabel: "ICE",
    logoFallback: "الشعار",
    profileLogoAlt: "شعار الشركة",
    pdfLogoAlt: "الشعار",
    defaultBusinessName: "شركتك",
    defaultBusinessAddress: "العنوان",
    pdfReadyShare: "ملف PDF جاهز للمشاركة",
    pdfDownloaded: "تم تنزيل PDF",
    shareUnavailableDownloadStarted: "المشاركة غير متاحة، تم بدء التنزيل.",
    pdfUnknownError: "خطأ غير معروف أثناء إنشاء ملف PDF.",
    documentSavedSuccess: "تم حفظ المستند بنجاح",
    offlineQueued: "وضع عدم الاتصال: تمت إضافة المستند إلى الطابور المحلي.",
    documentSaveError: "حدث خطأ أثناء حفظ المستند",
    whatsappClient: "العميل",
    whatsappClientPhone: "هاتف العميل",
    authBrand: "Craftsman SaaS",
    authTitle: "مصادقة آمنة",
    authDescription: "أدر عروض الأسعار والفواتير بأمان عبر تجربة بسيطة واحترافية.",
    authLogin: "تسجيل الدخول",
    authSignup: "إنشاء حساب",
    authLoginTitle: "تسجيل الدخول",
    authSignupTitle: "إنشاء حساب",
    authLoginSubtitle: "ادخل إلى مساحة الفوترة الخاصة بك.",
    authSignupSubtitle: "أنشئ حسابك الخاص بك في ثوانٍ.",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    passwordLabel: "كلمة المرور",
    passwordPlaceholder: "••••••••",
    authLoginSuccess: "تم تسجيل الدخول بنجاح",
    authSignupVerifySuccess: "تم إنشاء الحساب. تحقّق من بريدك الإلكتروني لتفعيل الوصول.",
    authSignupSuccess: "تم إنشاء الحساب وتسجيل الدخول.",
    authInvalidCreds: "بيانات الدخول غير صحيحة.",
    authEmailNotConfirmed: "يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.",
    authEmailUsed: "هذا البريد الإلكتروني مستخدم بالفعل.",
    authUnexpectedError: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    pageNotFoundTitle: "الصفحة غير موجودة",
    pageNotFoundDescription: "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
    goHome: "الصفحة الرئيسية",
    somethingWrong: "حدث خطأ ما",
    unexpectedErrorTryAgain: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
    tryAgain: "أعد المحاولة",
    companyNamePlaceholder: "ورشة مثال",
    phonePlaceholder: "06XXXXXXXX",
    addressPlaceholder: "العنوان الكامل",
    icePlaceholder: "رقم ICE",
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
    syncSuccess: "Sync completed successfully!",
    businessInfoTitle: "Business info",
    businessIceLabel: "ICE",
    logoFallback: "Logo",
    profileLogoAlt: "Company logo",
    pdfLogoAlt: "Logo",
    defaultBusinessName: "Your business",
    defaultBusinessAddress: "Address",
    pdfReadyShare: "PDF ready to share",
    pdfDownloaded: "PDF downloaded",
    shareUnavailableDownloadStarted: "Sharing unavailable, download started.",
    pdfUnknownError: "Unknown error while generating the PDF.",
    documentSavedSuccess: "Document saved successfully",
    offlineQueued: "Offline mode: document added to local queue.",
    documentSaveError: "Error while saving the document",
    whatsappClient: "Client",
    whatsappClientPhone: "Client phone",
    authBrand: "Craftsman SaaS",
    authTitle: "Secure authentication",
    authDescription: "Manage your quotes and invoices securely with a simple, professional experience.",
    authLogin: "Sign in",
    authSignup: "Create account",
    authLoginTitle: "Sign in",
    authSignupTitle: "Create account",
    authLoginSubtitle: "Access your billing workspace.",
    authSignupSubtitle: "Create your artisan account in seconds.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    authLoginSuccess: "Signed in successfully",
    authSignupVerifySuccess: "Account created. Check your email to activate access.",
    authSignupSuccess: "Account created and signed in.",
    authInvalidCreds: "Invalid credentials.",
    authEmailNotConfirmed: "Please confirm your email before signing in.",
    authEmailUsed: "This email is already in use.",
    authUnexpectedError: "An error occurred. Please try again.",
    pageNotFoundTitle: "Page not found",
    pageNotFoundDescription: "The page you're looking for doesn't exist or has been moved.",
    goHome: "Go home",
    somethingWrong: "Something went wrong",
    unexpectedErrorTryAgain: "An unexpected error occurred. Please try again.",
    tryAgain: "Try again",
    companyNamePlaceholder: "Sample Workshop",
    phonePlaceholder: "06XXXXXXXX",
    addressPlaceholder: "Full address",
    icePlaceholder: "ICE number",
  },
};