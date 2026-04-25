import { useMemo, useState } from "react";
import { Navigate, createFileRoute } from "@tanstack/react-router";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { uiDictionary } from "@/lib/ui-i18n";
import { useUiLanguage } from "@/lib/ui-language";

type AuthMode = "login" | "signup";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { user, isLoading, signIn, signUp } = useAuth();
  const { uiLanguage } = useUiLanguage();
  const t = uiDictionary[uiLanguage];
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const title = mode === "login" ? t.authLoginTitle : t.authSignupTitle;
  const subtitle = useMemo(() => (mode === "login" ? t.authLoginSubtitle : t.authSignupSubtitle), [mode, t.authLoginSubtitle, t.authSignupSubtitle]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">{t.loading}</div>;
  }

  if (user) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInlineError(null);
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
        toast.success(t.authLoginSuccess);
        return;
      }

      const { needsEmailVerification } = await signUp(email.trim(), password);
      if (needsEmailVerification) {
        toast.success(t.authSignupVerifySuccess);
      } else {
        toast.success(t.authSignupSuccess);
      }
    } catch (error) {
      const message = normalizeAuthError(error, t);
      setInlineError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.authBrand}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{t.authTitle}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t.authDescription}
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-8">
          <div className="mb-5 inline-flex w-full rounded-md border border-border p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setInlineError(null);
              }}
              className={`flex-1 rounded-sm px-3 py-2 text-sm font-medium transition ${
                mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t.authLogin}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setInlineError(null);
              }}
              className={`flex-1 rounded-sm px-3 py-2 text-sm font-medium transition ${
                mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t.authSignup}
            </button>
          </div>

          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {inlineError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{inlineError}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t.emailLabel}</label>
              <Input
                type="email"
                autoComplete="email"
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t.passwordLabel}</label>
              <Input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="animate-spin" /> : null}
              {mode === "login" ? t.authLogin : t.authSignup}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}

function normalizeAuthError(error: unknown, t: ReturnType<typeof getDictionaryShape>) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("invalid login credentials")) {
    return t.authInvalidCreds;
  }

  if (message.includes("email not confirmed")) {
    return t.authEmailNotConfirmed;
  }

  if (message.includes("user already registered")) {
    return t.authEmailUsed;
  }

  return t.authUnexpectedError;
}

function getDictionaryShape() {
  return uiDictionary.fr;
}