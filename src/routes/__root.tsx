import { Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { setupPwaRegistration } from "@/lib/pwa";
import { uiDictionary } from "@/lib/ui-i18n";
import { UiLanguageProvider, useUiLanguage } from "@/lib/ui-language";

function NotFoundComponent() {
  const lang =
    typeof document !== "undefined" && ["fr", "ar", "en"].includes(document.documentElement.lang)
      ? (document.documentElement.lang as "fr" | "ar" | "en")
      : "fr";
  const t = uiDictionary[lang];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t.pageNotFoundTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.pageNotFoundDescription}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.goHome}
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lovable App" },
      { name: "description", content: "Lovable Generated Project" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Lovable Generated Project" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="w-full max-w-[100vw] overflow-x-hidden">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    setupPwaRegistration();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UiLanguageProvider>
          <RootContent />
        </UiLanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootContent() {
  const { isUiRtl } = useUiLanguage();

  return (
    <div dir={isUiRtl ? "rtl" : "ltr"} className="w-full max-w-[100vw] overflow-x-hidden">
      <Suspense fallback={<LoadingSpinner />}>
        <Outlet />
      </Suspense>
      <Toaster richColors position="top-right" />
    </div>
  );
}
