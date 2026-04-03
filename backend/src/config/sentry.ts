import * as Sentry from "@sentry/node";
import { env } from "./env";

export function initSentry() {
  if (!env.SENTRY_DSN) {
    console.warn("⚠️ SENTRY_DSN no configurado — monitoreo desactivado");
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV || "development",
    tracesSampleRate: 0.5,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
  });

  console.log("✅ Sentry inicializado");
}

export function captureError(error: Error, context?: Record<string, any>) {
  console.error(`[ERROR] ${error.message}`, context);
  if (env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}

export { Sentry };
