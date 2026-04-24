import { Link, Navigate, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Plus, Settings, LoaderCircle, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { uiDictionary } from "@/lib/ui-i18n";
import { useUiLanguage } from "@/lib/ui-language";

type AppLayoutProps = {
  children: React.ReactNode;
};

const navItems = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/invoice/new", label: "Nouvelle", icon: Plus },
  { to: "/settings", label: "Paramètres", icon: Settings },
] as const;

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isLoading, signOut } = useAuth();
  const location = useLocation();
  const { uiLanguage, setUiLanguage } = useUiLanguage();
  const t = uiDictionary[uiLanguage];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> {t.loading}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 hidden w-full box-border border-b border-border bg-background/95 px-4 backdrop-blur md:block">
        <div className="flex h-14 w-full items-center justify-between box-border">
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === "/invoice/new"
                  ? location.pathname.startsWith("/invoice/new")
                  : location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>
                    {item.to === "/dashboard"
                      ? t.navDashboard
                      : item.to === "/invoice/new"
                        ? t.navNew
                        : t.navSettings}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-md border border-border bg-background p-1" role="group" aria-label={t.languageUi}>
              <Button type="button" size="sm" variant={uiLanguage === "fr" ? "default" : "ghost"} onClick={() => setUiLanguage("fr")}>{t.languageFr}</Button>
              <Button type="button" size="sm" variant={uiLanguage === "ar" ? "default" : "ghost"} onClick={() => setUiLanguage("ar")}>{t.languageAr}</Button>
              <Button type="button" size="sm" variant={uiLanguage === "en" ? "default" : "ghost"} onClick={() => setUiLanguage("en")}>{t.languageEn}</Button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  await signOut();
                  toast.success(t.logoutSuccess);
                } catch {
                  toast.error(t.logoutError);
                }
              }}
            >
              <LogOut className="h-4 w-4" /> {t.logout}
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[100vw] overflow-x-hidden pb-24 md:pb-8">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 m-0 w-full max-w-[100vw] box-border border-t border-border bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur md:hidden">
        <ul className="grid grid-cols-3 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.to === "/invoice/new"
                ? location.pathname.startsWith("/invoice/new")
                : location.pathname === item.to;

            const isNew = item.to === "/invoice/new";

            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`flex flex-col items-center justify-center gap-1 rounded-md py-2 text-xs transition-colors ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                      isNew
                        ? "bg-primary text-primary-foreground"
                        : isActive
                          ? "bg-muted text-foreground"
                          : "bg-transparent text-current"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    {item.to === "/dashboard"
                      ? t.navDashboard
                      : item.to === "/invoice/new"
                        ? t.navNew
                        : t.navSettings}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}