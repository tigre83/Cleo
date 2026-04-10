import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { requireAuth, requireActivePlan } from "./middleware/auth";
import { securityHeaders, getCorsOptions, verifyWebhookSignature } from "./middleware/security";
import { initSentry, Sentry } from "./config/sentry";
import { runDailyCleanup, runAppointmentReminders } from "./services/cron.service";
import adminRoutes from "./routes/admin";
import {
  viewsRouter,
  authRouter,
  businessRouter,
  servicesRouter,
  webhookRouter,
  whatsappRouter,
  appointmentsRouter,
  conversationsRouter,
  blockedSlotsRouter,
  supportRouter,
} from "./routes";

// ============================================
// CLEO — Servidor Principal (Secured)
// ============================================

// Initialize Sentry before anything else
initSentry();

const app = express();

// --- Security middleware ---
app.use(securityHeaders);
app.use(cors(getCorsOptions()));

// Raw body for webhook signature verification
app.use("/api/webhook", express.json({
  verify: (req: any, _res, buf) => { req.rawBody = buf; }
}));
app.use(express.json());

// --- Health ---
app.get("/health", (_req, res) => {
  const { isWhatsAppReady } = require("./services/whatsapp.service");
  res.json({
    status: "ok",
    service: "cleo-api",
    version: "0.2.0",
    whatsapp: isWhatsAppReady() ? "ready" : "pendiente",
    timestamp: new Date().toISOString(),
  });
});

// --- Rutas públicas ---
app.use("/api/views", viewsRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/webhook", webhookRouter);  // Meta necesita acceso sin auth

// --- Rutas protegidas (sin restricción de plan) ---
app.use("/api/business", requireAuth, businessRouter);
app.use("/api/whatsapp", requireAuth, whatsappRouter);
app.use("/api/support", requireAuth, supportRouter);

// --- Rutas protegidas (requieren plan activo) ---
app.use("/api/appointments", requireAuth, requireActivePlan, appointmentsRouter);
app.use("/api/services", requireAuth, requireActivePlan, servicesRouter);
app.use("/api/conversations", requireAuth, requireActivePlan, conversationsRouter);
app.use("/api/blocked-slots", requireAuth, requireActivePlan, blockedSlotsRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// Error handler with Sentry
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (env.SENTRY_DSN) Sentry.captureException(err);
  console.error("💥 Error:", err.message);
  res.status(500).json({ error: env.NODE_ENV === "production" ? "Error interno" : err.message });
});

// --- Start ---
app.listen(env.PORT, () => {
  const waReady = env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_ACCESS_TOKEN !== "pendiente";
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   🤖 CLEO API — v0.2.0               ║
  ║   Puerto: ${String(env.PORT).padEnd(28)}║
  ║   Entorno: ${env.NODE_ENV.padEnd(27)}║
  ║   IA: Claude ✅                       ║
  ║   WhatsApp: ${waReady ? "✅ Listo" : "⏳ Pendiente"}                    ║
  ║   WA Phone: ${(env.WHATSAPP_PHONE_NUMBER_ID || "—").padEnd(27)}║
  ║   Webhook: ${(env.WEBHOOK_VERIFY_TOKEN || "—").padEnd(28)}║
  ╚═══════════════════════════════════════╝
  `);

  if (!waReady) {
    console.log("  ⚠️  WhatsApp no configurado — el sistema funciona sin WA");
    console.log("  ⚠️  Actualizar WHATSAPP_ACCESS_TOKEN y WHATSAPP_APP_SECRET cuando Meta resuelva");
    console.log("");
  }

  // Cron: limpieza diaria cada 24 horas
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  runDailyCleanup().catch(e => console.error("Error cron inicial:", e));
  setInterval(() => runDailyCleanup().catch(e => console.error("Error cron:", e)), TWENTY_FOUR_HOURS);

  // Recordatorios de citas: cada 30 minutos
  const THIRTY_MINUTES = 30 * 60 * 1000;
  runAppointmentReminders().catch(e => console.error("Error recordatorios inicial:", e));
  setInterval(() => runAppointmentReminders().catch(e => console.error("Error recordatorios:", e)), THIRTY_MINUTES);
});

export default app;
