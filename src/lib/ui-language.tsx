import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "fr" | "ar" | "en";

type UiLanguageContextValue = {
  uiLanguage: AppLanguage;
  setUiLanguage: (language: AppLanguage) => void;
  isUiRtl: boolean;
};

const UI_LANGUAGE_STORAGE_KEY = "app_ui_language_v1";
const UiLanguageContext = createContext<UiLanguageContextValue | null>(null);

export function UiLanguageProvider({ children }: { children: React.ReactNode }) {
  const [uiLanguage, setUiLanguage] = useState<AppLanguage>("fr");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
    if (stored === "fr" || stored === "ar" || stored === "en") {
      setUiLanguage(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, uiLanguage);
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = uiLanguage === "ar" ? "rtl" : "ltr";
  }, [uiLanguage]);

  const value = useMemo<UiLanguageContextValue>(
    () => ({
      uiLanguage,
      setUiLanguage,
      isUiRtl: uiLanguage === "ar",
    }),
    [uiLanguage],
  );

  return <UiLanguageContext.Provider value={value}>{children}</UiLanguageContext.Provider>;
}

export function useUiLanguage() {
  const context = useContext(UiLanguageContext);
  if (!context) {
    throw new Error("useUiLanguage must be used inside UiLanguageProvider");
  }
  return context;
}