import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { env } from "../config/env";

// ============================================
// 2. RATE LIMITING — Protección fuerza bruta
// ============================================

const loginAttempts: Map<string, { count: number; blockedUntil: number }> = new Map();
const codeAttempts: Map<string, number> = new Map();

export function loginRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record && record.blockedUntil > now) {
    const minutesLeft = Math.ceil((record.blockedUntil - now) / 60000);
    return res.status(429).json({ error: `Demasiados intentos. Intenta de nuevo en ${minutesLeft} minutos.` });
  }

  // Reset if block expired
  if (record && record.blockedUntil <= now) {
    loginAttempts.delete(ip);
  }

  next();
}

export function recordLoginFailure(ip: string) {
  const record = loginAttempts.get(ip) || { count: 0, blockedUntil: 0 };
  record.count++;
  if (record.count >= 5) {
    record.blockedUntil = Date.now() + 15 * 60 * 1000; // 15 min block
    record.count = 0;
  }
  loginAttempts.set(ip, record);
}

export function recordLoginSuccess(ip: string) {
  loginAttempts.delete(ip);
}

export function checkCodeAttempts(userId: string): boolean {
  const attempts = codeAttempts.get(userId) || 0;
  if (attempts >= 3) return false; // blocked
  return true;
}

export function recordCodeFailure(userId: string) {
  const attempts = codeAttempts.get(userId) || 0;
  codeAttempts.set(userId, attempts + 1);
}

export function resetCodeAttempts(userId: string) {
  codeAttempts.delete(userId);
}

// ============================================
// 3. INPUT VALIDATION HELPERS
// ============================================

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Strip HTML tags
    .replace(/['";]/g, "") // Strip SQL injection chars
    .trim()
    .slice(0, 2000); // Max length
}

export function isPositiveNumber(val: any): boolean {
  return typeof val === "number" && val > 0 && isFinite(val);
}

export function validateRequired(body: Record<string, any>, fields: string[]): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return `Campo requerido: ${field}`;
    }
  }
  return null;
}

// ============================================
// 4. SECURITY HEADERS
// ============================================

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  if (env.NODE_ENV === "production") {
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' https://plausible.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://api.anthropic.com https://*.supabase.co https://graph.facebook.com https://api.resend.com https://plausible.io;");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

// ============================================
// 5. CORS — solo dominios de Cleo
// ============================================

export function getCorsOptions() {
  const allowedOrigins = env.NODE_ENV === "production"
    ? [env.FRONTEND_URL, "https://cleo.app", "https://app.cleo.app"]
    : ["http://localhost:3000", "http://localhost:5173"];

  return {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("CORS no permitido"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
}

// ============================================
// 7. WEBHOOK SIGNATURE VERIFICATION
// ============================================

export function verifyWebhookSignature(req: Request): boolean {
  const signature = req.headers["x-hub-signature-256"] as string;
  if (!signature || !env.WHATSAPP_APP_SECRET) return false;

  const expectedSignature = "sha256=" + crypto
    .createHmac("sha256", env.WHATSAPP_APP_SECRET)
    .update((req as any).rawBody || JSON.stringify(req.body))
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// ============================================
// 9. LOG SANITIZER — mask sensitive data
// ============================================

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return "****";
  return "***" + phone.slice(-4);
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***@***";
  return user.slice(0, 2) + "***@" + domain;
}

// ============================================
// 8. AUDIT LOG
// ============================================

import { supabaseAdmin } from "../config/supabase";

export async function auditLog(action: string, details: Record<string, any>, adminEmail?: string) {
  try {
    await supabaseAdmin.from("audit_log").insert({
      action,
      details,
      admin_email: adminEmail || "system",
    });
  } catch (err: any) {
    console.error("Audit log error:", err?.message);
  }
}
