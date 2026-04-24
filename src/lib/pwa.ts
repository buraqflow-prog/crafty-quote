import { registerSW } from "virtual:pwa-register";

export function setupPwaRegistration() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const hostname = window.location.hostname;
  const isPreviewHost = hostname.includes("id-preview--") || hostname.includes("lovableproject.com");

  if (isInIframe || isPreviewHost) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister();
      });
    });
    return;
  }

  registerSW({ immediate: true });
}
