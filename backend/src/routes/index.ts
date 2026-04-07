import { Router, Request, Response } from "express";
import crypto from "crypto";
import { supabaseAdmin, supabase } from "../config/supabase";
import { env } from "../config/env";
import { verifyWebhook, handleIncomingMessage, sendTestMessage, WebhookBody } from "../services/whatsapp.service";
import { getAppointmentsByDate, createAppointment, cancelAppointment } from "../services/appointments.service";
import { loginRateLimit, recordLoginFailure, recordLoginSuccess, validateRequired, isValidEmail, sanitizeInput, verifyWebhookSignature as verifyWHSig, auditLog, maskPhone } from "../middleware/security";

// ============================================
// HELPERS
// ============================================

const CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I, O, 0, 1

function generateCode(): string {
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes).map(b => CODE_CHARSET[b % CODE_CHARSET.length]).join("");
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code.toUpperCase()).digest("hex");
}

async function sendVerificationEmail(email: string, code: string, businessName: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY no configurada — código:", code);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Cleo <hola@cleoia.app>",
      to: [email],
      subject: `${code} — Tu código de verificación de Cleo`,
      text: [
        `Hola,`,
        ``,
        `Tu código de verificación para ${businessName} es:`,
        ``,
        `${code}`,
        ``,
        `Este código expira en 15 minutos.`,
        `Si no solicitaste este código, ignora este mensaje.`,
        ``,
        `— Cleo`,
      ].join("\n"),
    }),
  });
}


// ============================================
// PAGE VIEWS (analytics propio)
// ============================================
export const viewsRouter = Router();

// POST /api/views — registrar visita
viewsRouter.post("/", async (req: Request, res: Response) => {
  const { page, referrer } = req.body;
  const userAgent = req.headers["user-agent"] || "";

  // Ignorar bots
  const isBot = /bot|crawler|spider|crawling/i.test(userAgent);
  if (isBot) return res.json({ ok: true });

  await supabaseAdmin.from("page_views").insert({
    page: page || "/",
    referrer: referrer || null,
    user_agent: userAgent.slice(0, 200),
  });

  return res.json({ ok: true });
});

// GET /api/views/stats — obtener estadísticas (solo admin)
viewsRouter.get("/stats", async (_req: Request, res: Response) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [total, today, week, month] = await Promise.all([
    supabaseAdmin.from("page_views").select("id", { count:"exact", head:true }),
    supabaseAdmin.from("page_views").select("id", { count:"exact", head:true }).gte("created_at", todayStart),
    supabaseAdmin.from("page_views").select("id", { count:"exact", head:true }).gte("created_at", weekStart),
    supabaseAdmin.from("page_views").select("id", { count:"exact", head:true }).gte("created_at", monthStart),
  ]);

  // Top referrers este mes
  const { data: refs } = await supabaseAdmin
    .from("page_views")
    .select("referrer")
    .gte("created_at", monthStart)
    .not("referrer", "is", null);

  const refCount: Record<string, number> = {};
  (refs || []).forEach(r => {
    if (r.referrer) {
      try {
        const host = new URL(r.referrer).hostname.replace("www.", "");
        refCount[host] = (refCount[host] || 0) + 1;
      } catch {}
    }
  });
  const topReferrers = Object.entries(refCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));

  return res.json({
    total:   total.count   || 0,
    today:   today.count   || 0,
    week:    week.count    || 0,
    month:   month.count   || 0,
    topReferrers,
  });
});

// ============================================
// AUTH ROUTES
// ============================================

export const authRouter = Router();

// POST /api/auth/register — Paso 1: crear cuenta + enviar código
authRouter.post("/register", async (req: Request, res: Response) => {
  const { email, password, business_name } = req.body;

  if (!email || !password || !business_name) {
    return res.status(400).json({ error: "email, password y business_name son requeridos" });
  }

  // Crear usuario en Supabase Auth (admin API — no envía email, sin rate limit)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  });
  if (authError) return res.status(400).json({ error: authError.message });

  // Generar código de verificación
  const code = generateCode();
  const codeHash = hashCode(code);
  const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

  // Crear registro del negocio con código hasheado
  const { data: business, error: bizError } = await supabaseAdmin
    .from("businesses")
    .insert({
      user_id: authData.user?.id,
      email,
      business_name,
      assistant_name: `Asistente de ${business_name}`,
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      verification_code_hash: codeHash,
      verification_code_expires_at: codeExpiresAt,
      email_verified: false,
    })
    .select()
    .single();

  if (bizError) return res.status(500).json({ error: bizError.message });

  // Enviar email con código (background)
  sendVerificationEmail(email, code, business_name)
    .catch(err => console.error("Error enviando código:", err));

  res.json({ user: authData.user, business, session: null });
});

// POST /api/auth/verify — Verificar código de 6 caracteres
authRouter.post("/verify", async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "email y code son requeridos" });
  }

  const inputHash = hashCode(code);

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, verification_code_hash, verification_code_expires_at, email_verified")
    .eq("email", email)
    .single();

  if (!business) {
    return res.status(404).json({ error: "Cuenta no encontrada" });
  }

  if (business.email_verified) {
    return res.json({ verified: true });
  }

  // Verificar expiración
  if (new Date(business.verification_code_expires_at) < new Date()) {
    return res.status(410).json({ error: "code_expired", message: "Código expirado" });
  }

  // Verificar hash
  if (inputHash !== business.verification_code_hash) {
    return res.status(401).json({ error: "code_invalid", message: "Código incorrecto, intenta de nuevo" });
  }

  // Código correcto → marcar como verificado
  await supabaseAdmin
    .from("businesses")
    .update({
      email_verified: true,
      verification_code_hash: null,
      verification_code_expires_at: null,
    })
    .eq("id", business.id);

  res.json({ verified: true });
});

// POST /api/auth/resend-code — Reenviar código
authRouter.post("/resend-code", async (req: Request, res: Response) => {
  const { email } = req.body;

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, business_name, email_verified")
    .eq("email", email)
    .single();

  if (!business) return res.status(404).json({ error: "Cuenta no encontrada" });
  if (business.email_verified) return res.json({ verified: true });

  const code = generateCode();
  const codeHash = hashCode(code);
  const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await supabaseAdmin
    .from("businesses")
    .update({
      verification_code_hash: codeHash,
      verification_code_expires_at: codeExpiresAt,
    })
    .eq("id", business.id);

  sendVerificationEmail(email, code, business.business_name)
    .catch(err => console.error("Error reenviando código:", err));

  res.json({ sent: true });
});

// POST /api/auth/login
authRouter.post("/login", loginRateLimit, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ip = req.ip || "unknown";

  // Input validation
  const missing = validateRequired(req.body, ["email", "password"]);
  if (missing) return res.status(400).json({ error: missing });
  if (!isValidEmail(email)) return res.status(400).json({ error: "Email inválido" });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    recordLoginFailure(ip);
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }
  recordLoginSuccess(ip);
  res.json(data);
});

// POST /api/auth/request-password-change — Enviar código para cambiar contraseña
authRouter.post("/request-password-change", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Token requerido" });
  const token = authHeader.split(" ")[1];
  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData?.user) return res.status(401).json({ error: "Token inválido" });

  const { data: business } = await supabaseAdmin
    .from("businesses").select("id, email, business_name").eq("user_id", userData.user.id).single();
  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  const code = generateCode();
  const codeHash = hashCode(code);
  const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await supabaseAdmin.from("businesses").update({
    verification_code_hash: codeHash,
    verification_code_expires_at: codeExpiresAt,
  }).eq("id", business.id);

  if (env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Cleo <hola@cleoia.app>", to: [business.email],
        subject: `${code} — Código para cambiar tu contraseña`,
        text: `Tu código para cambiar la contraseña de ${business.business_name} es:\n\n${code}\n\nExpira en 15 minutos.`,
      }),
    });
  } else {
    console.warn("⚠️ RESEND no configurada — código:", code);
  }

  res.json({ sent: true });
});


// POST /api/auth/forgot-password — enviar código sin estar autenticado
authRouter.post("/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email requerido" });

  const { data: business } = await supabaseAdmin
    .from("businesses").select("id, business_name, email_verified").eq("email", email).single();

  if (!business) return res.json({ sent: true }); // No revelar si existe

  const code = generateCode();
  const codeHash = hashCode(code);
  const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await supabaseAdmin.from("businesses").update({
    verification_code_hash: codeHash,
    verification_code_expires_at: codeExpiresAt,
  }).eq("id", business.id);

  const bizName = business?.business_name || "tu negocio";
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Cleo <noreply@cleoia.app>",
      to: [email],
      subject: `${code} — Recupera tu contraseña de Cleo`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080808;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
        <tr><td style="text-align:center;padding-bottom:28px;">
          <span style="font-size:30px;font-weight:800;color:#4ADE80;">cleo.</span>
          <div style="font-size:11px;letter-spacing:2px;color:#555;margin-top:4px;">powered by ia</div>
        </td></tr>
        <tr><td style="background:#0D0D0D;border:1px solid #1A1A1A;border-radius:16px;padding:36px;">
          <p style="margin:0 0 6px;font-size:13px;color:#6B7280;">Hola,</p>
          <h1 style="margin:0 0 4px;font-size:20px;font-weight:800;color:#F9FAFB;">${bizName}</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#9CA3AF;">Recibimos una solicitud para recuperar tu contraseña de Cleo.</p>
          <p style="margin:0 0 12px;font-size:13px;color:#6B7280;text-align:center;">Tu código de verificación es:</p>
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:#080808;border:1px solid #1E1E1E;border-radius:12px;padding:18px 32px;">
              <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#22D3EE;font-family:'Courier New',monospace;">${code}</span>
            </div>
          </div>
          <div style="background:#0A1A0A;border:1px solid #14532D;border-radius:8px;padding:12px 16px;">
            <p style="margin:0;font-size:12px;color:#6B7280;">⏱ Este código <strong style="color:#F9FAFB;">expira en 15 minutos</strong>. Si no solicitaste este cambio, ignora este email.</p>
          </div>
        </td></tr>
        <tr><td style="text-align:center;padding-top:20px;">
          <p style="margin:0;font-size:11px;color:#374151;">© 2026 Cleo · Hecho en Ecuador para PYMEs</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }),
  });

  return res.json({ sent: true });
});

// POST /api/auth/reset-password-with-code — nueva contraseña con código
authRouter.post("/reset-password-with-code", async (req: Request, res: Response) => {
  const { email, code, new_password } = req.body;
  if (!email || !code || !new_password) return res.status(400).json({ error: "Faltan campos" });

  const inputHash = hashCode(code);
  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, user_id, verification_code_hash, verification_code_expires_at")
    .eq("email", email).single();

  if (!business) return res.status(404).json({ error: "Cuenta no encontrada" });
  if (new Date(business.verification_code_expires_at) < new Date()) return res.status(410).json({ error: "Código expirado" });
  if (inputHash !== business.verification_code_hash) return res.status(401).json({ error: "Código inválido" });

  const { error } = await supabaseAdmin.auth.admin.updateUserById(business.user_id, { password: new_password });
  if (error) return res.status(400).json({ error: error.message });

  await supabaseAdmin.from("businesses").update({
    verification_code_hash: null,
    verification_code_expires_at: null,
  }).eq("id", business.id);

  return res.json({ updated: true });
});

// POST /api/auth/change-password — Verificar código + cambiar contraseña
authRouter.post("/change-password", async (req: Request, res: Response) => {
  const { code, new_password } = req.body;
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Token requerido" });
  const token = authHeader.split(" ")[1];
  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData?.user) return res.status(401).json({ error: "Token inválido" });

  const { data: business } = await supabaseAdmin
    .from("businesses").select("id, verification_code_hash, verification_code_expires_at")
    .eq("user_id", userData.user.id).single();
  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  // Verificar código
  if (new Date(business.verification_code_expires_at) < new Date()) {
    return res.status(410).json({ error: "code_expired", message: "Código expirado" });
  }
  if (hashCode(code) !== business.verification_code_hash) {
    return res.status(401).json({ error: "code_invalid", message: "Código incorrecto" });
  }

  // Cambiar contraseña
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, { password: new_password });
  if (error) return res.status(400).json({ error: error.message });

  // Limpiar código
  await supabaseAdmin.from("businesses").update({
    verification_code_hash: null, verification_code_expires_at: null,
  }).eq("id", business.id);

  res.json({ updated: true });
});

// ============================================
// SUPPORT ROUTES
// ============================================

export const supportRouter = Router();

// POST /api/support — Enviar mensaje de soporte via Resend
supportRouter.post("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { message } = req.body;

  if (!message?.trim()) return res.status(400).json({ error: "Escribe tu mensaje" });

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("email, business_name, plan, trial_ends_at")
    .eq("user_id", userId)
    .single();

  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  if (env.RESEND_API_KEY) {
    const now = new Date().toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Cleo Soporte <hola@cleoia.app>",
        to: ["soporte@cleoia.app"],
        reply_to: business.email,
        subject: `Soporte — ${business.business_name}`,
        text: [
          `Nuevo mensaje de soporte`,
          ``,
          `Negocio: ${business.business_name}`,
          `Email: ${business.email}`,
          `Plan: ${business.plan}`,
          `Fecha: ${now}`,
          ``,
          `Mensaje:`,
          message.trim(),
        ].join("\n"),
      }),
    });
  }

  res.json({ sent: true });
});

// ============================================
// BUSINESS ROUTES
// ============================================

// POST /api/support/request-delete — Enviar código para eliminar cuenta
supportRouter.post("/request-delete", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { business_name } = req.body;

  const { data: business } = await supabaseAdmin
    .from("businesses").select("id, email, business_name").eq("user_id", userId).single();
  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  if (business.business_name !== business_name) {
    return res.status(400).json({ error: "Nombre no coincide" });
  }

  const code = generateCode();
  const codeHash = hashCode(code);
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabaseAdmin.from("businesses").update({
    verification_code_hash: codeHash,
    verification_code_expires_at: expires,
  }).eq("id", business.id);

  if (env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Cleo <hola@cleoia.app>", to: [business.email],
        subject: `${code} — Código para eliminar tu cuenta de Cleo`,
        text: `Tu código para eliminar "${business.business_name}" es:\n\n${code}\n\nExpira en 10 minutos.`,
      }),
    });
  }

  res.json({ sent: true });
});

// POST /api/support/confirm-delete — Verificar código y eliminar
supportRouter.post("/confirm-delete", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { code } = req.body;

  const { data: biz } = await supabaseAdmin
    .from("businesses").select("id, verification_code_hash, verification_code_expires_at")
    .eq("user_id", userId).single();
  if (!biz) return res.status(404).json({ error: "No encontrado" });

  if (new Date(biz.verification_code_expires_at) < new Date()) return res.status(410).json({ error: "code_expired" });
  if (hashCode(code) !== biz.verification_code_hash) return res.status(401).json({ error: "code_invalid" });

  await supabaseAdmin.from("blocked_slots").delete().eq("business_id", biz.id);
  await supabaseAdmin.from("conversations").delete().eq("business_id", biz.id);
  await supabaseAdmin.from("appointments").delete().eq("business_id", biz.id);
  await supabaseAdmin.from("whatsapp_connections").delete().eq("business_id", biz.id);
  await supabaseAdmin.from("services").delete().eq("business_id", biz.id);
  await supabaseAdmin.from("businesses").delete().eq("id", biz.id);
  await supabaseAdmin.auth.admin.deleteUser(userId);

  res.json({ deleted: true });
});

// ============================================
// BUSINESS ROUTES (original)

export const businessRouter = Router();

// GET /api/business/me
businessRouter.get("/me", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return res.status(404).json({ error: "Negocio no encontrado" });
  res.json(data);
});

// PUT /api/business/me — Actualizar negocio
businessRouter.put("/me", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { business_name, business_type, schedule, appointment_duration, assistant_name, ia_paused } = req.body;

  const updates: any = {};
  if (business_name) updates.business_name = business_name;
  if (business_type) updates.business_type = business_type;
  if (schedule) updates.schedule = schedule;
  if (appointment_duration) updates.appointment_duration = appointment_duration;
  if (assistant_name) updates.assistant_name = assistant_name;
  if (typeof ia_paused === "boolean") updates.ia_paused = ia_paused;

  const { data, error } = await supabaseAdmin
    .from("businesses")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/business/me — Eliminar cuenta (irreversible)
businessRouter.delete("/me", async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const { data: business } = await supabaseAdmin
    .from("businesses").select("id, business_name").eq("user_id", userId).single();
  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  const { confirm_name } = req.body;
  if (confirm_name !== business.business_name) {
    return res.status(400).json({ error: "El nombre no coincide. Escribe el nombre exacto de tu negocio." });
  }

  // Cascading delete via FK constraints handles whatsapp_connections, appointments, conversations, blocked_slots
  await supabaseAdmin.from("businesses").delete().eq("id", business.id);

  // Delete auth user
  await supabaseAdmin.auth.admin.deleteUser(userId);

  res.json({ deleted: true });
});

// ============================================
// WEBHOOK ROUTES (WhatsApp)
// ============================================

export const webhookRouter = Router();

// GET /api/webhook/whatsapp — Verificación Meta
webhookRouter.get("/whatsapp", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"] as string;
  const token = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"] as string;

  const result = verifyWebhook(mode, token, challenge, env.WEBHOOK_VERIFY_TOKEN || "");
  if (result) {
    res.status(200).send(result);
  } else {
    res.status(403).send("Verificación fallida");
  }
});

// POST /api/webhook/whatsapp — Mensajes entrantes
webhookRouter.post("/whatsapp", async (req: Request, res: Response) => {
  // Verify Meta webhook signature (skip if secret not configured yet)
  if (env.NODE_ENV === "production" && env.WHATSAPP_APP_SECRET && env.WHATSAPP_APP_SECRET !== "pendiente") {
    if (!verifyWHSig(req)) {
      console.warn("⚠️ Webhook signature inválida — request rechazado");
      return res.sendStatus(401);
    }
  }

  res.sendStatus(200); // Responder 200 inmediatamente

  try {
    const body = req.body as WebhookBody;
    if (body.object !== "whatsapp_business_account") return;
    handleIncomingMessage(body).catch(err => console.error("Error webhook:", err));
  } catch (error) {
    console.error("Error en webhook:", error);
  }
});

// ============================================
// WHATSAPP CONNECTION ROUTES (Embedded Signup)
// ============================================

export const whatsappRouter = Router();

// POST /api/whatsapp/connect — Recibe datos tras Embedded Signup de Meta
whatsappRouter.post("/connect", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { access_token, phone_number_id, waba_id, phone_number } = req.body;

  // Obtener negocio del usuario
  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, business_name")
    .eq("user_id", userId)
    .single();

  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  // Guardar conexión
  const { data: connection, error } = await supabaseAdmin
    .from("whatsapp_connections")
    .insert({
      business_id: business.id,
      phone_number_id,
      waba_id,
      access_token,
      phone_number,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Enviar mensaje de prueba
  if (phone_number) {
    await sendTestMessage(phone_number_id, phone_number, access_token, business.business_name);
  }

  res.json({ success: true, connection });
});

// POST /api/whatsapp/disconnect — Desconectar WhatsApp
whatsappRouter.post("/disconnect", async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const { data: business } = await supabaseAdmin
    .from("businesses").select("id").eq("user_id", userId).single();
  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  await supabaseAdmin
    .from("whatsapp_connections")
    .update({ active: false })
    .eq("business_id", business.id);

  res.json({ disconnected: true });
});

// ============================================
// APPOINTMENTS ROUTES
// ============================================

export const appointmentsRouter = Router();

// GET /api/appointments?date=2026-04-01
appointmentsRouter.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const date = req.query.date as string || new Date().toISOString().split("T")[0];

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  const appointments = await getAppointmentsByDate(business.id, date);
  res.json(appointments);
});

// POST /api/appointments — Crear cita manual
appointmentsRouter.post("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { client_name, client_phone, datetime, duration_minutes } = req.body;

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, appointment_duration")
    .eq("user_id", userId)
    .single();

  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  const result = await createAppointment(
    business.id,
    client_phone || "",
    client_name,
    datetime,
    duration_minutes || business.appointment_duration,
    "manual"
  );

  if (!result.success) return res.status(409).json({ error: result.error });
  res.json(result.appointment);
});

// PUT /api/appointments/:id — Actualizar estado
appointmentsRouter.put("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { status } = req.body;

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  if (status === "cancelled") {
    const result = await cancelAppointment(req.params.id as string, business.id);
    if (!result.success) return res.status(500).json({ error: result.error });
    return res.json(result.appointment);
  }

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .update({ status })
    .eq("id", req.params.id as string)
    .eq("business_id", business.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ============================================
// CONVERSATIONS ROUTES
// ============================================

export const conversationsRouter = Router();

// GET /api/conversations
conversationsRouter.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  const { data } = await supabaseAdmin
    .from("conversations")
    .select("id, client_phone, client_name, last_message_at")
    .eq("business_id", business.id)
    .order("last_message_at", { ascending: false })
    .limit(50);

  res.json(data || []);
});

// GET /api/conversations/:phone
conversationsRouter.get("/:phone", async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  const { data } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("business_id", business.id)
    .eq("client_phone", req.params.phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return res.status(404).json({ error: "Conversación no encontrada" });
  res.json(data);
});

// ============================================
// CANCEL WITH WHATSAPP NOTIFICATION
// ============================================

// POST /api/appointments/:id/cancel — Cancelar + avisar al cliente por WhatsApp
appointmentsRouter.post("/:id/cancel", async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, business_name, schedule, appointment_duration")
    .eq("user_id", userId)
    .single();
  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  // Obtener cita
  const { data: appt } = await supabaseAdmin
    .from("appointments")
    .select("*")
    .eq("id", req.params.id as string)
    .eq("business_id", business.id)
    .single();
  if (!appt) return res.status(404).json({ error: "Cita no encontrada" });

  // Cancelar en DB
  const result = await cancelAppointment(req.params.id as string, business.id);
  if (!result.success) return res.status(500).json({ error: result.error });

  // Buscar horarios disponibles para ofrecer alternativas
  const apptDate = new Date(appt.datetime);
  const dateStr = apptDate.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });
  const timeStr = apptDate.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
  const clientFirstName = appt.client_name?.split(" ")[0] || "Cliente";

  // Obtener horarios disponibles (próximos 3 días)
  const alternatives = [];
  for (let d = 0; d < 3 && alternatives.length < 4; d++) {
    const checkDate = new Date(apptDate);
    checkDate.setDate(checkDate.getDate() + d);
    const checkDateStr = checkDate.toISOString().split("T")[0];

    // Verificar que no esté bloqueado
    const { data: blockedSlot } = await supabaseAdmin
      .from("blocked_slots")
      .select("id")
      .eq("business_id", business.id)
      .eq("date", checkDateStr)
      .is("start_time", null) // día completo bloqueado
      .maybeSingle();

    if (blockedSlot) continue;

    // Obtener citas existentes del día
    const existingAppts = await getAppointmentsByDate(business.id, checkDateStr);
    const occupiedTimes = new Set(existingAppts.map(a => new Date(a.datetime).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })));

    // Ofrecer horarios estándar que no estén ocupados
    const slots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
    const dayName = checkDate.toLocaleDateString("es-EC", { weekday: "long", day: "numeric" });
    for (const slot of slots) {
      if (!occupiedTimes.has(slot) && alternatives.length < 4) {
        alternatives.push(`${dayName} a las ${slot}`);
      }
    }
  }

  // Enviar mensaje por WhatsApp
  if (appt.client_phone) {
    const { data: waConn } = await supabaseAdmin
      .from("whatsapp_connections")
      .select("phone_number_id, access_token")
      .eq("business_id", business.id)
      .eq("active", true)
      .single();

    if (waConn) {
      let message = `Hola ${clientFirstName}, lamentablemente tuvimos que cancelar tu cita del ${dateStr} a las ${timeStr}.`;
      if (alternatives.length > 0) {
        message += `\n\nTe ofrecemos estos horarios disponibles:\n${alternatives.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\n¿Cuál te viene mejor?`;
      } else {
        message += "\n\nContáctanos para reagendar en un horario que te funcione.";
      }

      // Enviar via WhatsApp Cloud API
      try {
        const axios = require("axios");
        await axios.post(
          `https://graph.facebook.com/v19.0/${waConn.phone_number_id}/messages`,
          {
            messaging_product: "whatsapp",
            to: appt.client_phone,
            type: "text",
            text: { body: message },
          },
          { headers: { Authorization: `Bearer ${waConn.access_token}` } }
        );
      } catch (err) {
        console.error("Error enviando cancelación por WA:", err);
      }
    }
  }

  res.json({ cancelled: true, appointment: result.appointment, alternatives_offered: alternatives.length });
});

// ============================================
// BLOCKED SLOTS ROUTES
// ============================================

export const blockedSlotsRouter = Router();

// GET /api/blocked-slots?month=2026-04
blockedSlotsRouter.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const month = req.query.month as string; // YYYY-MM

  const { data: business } = await supabaseAdmin
    .from("businesses").select("id").eq("user_id", userId).single();
  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  let query = supabaseAdmin
    .from("blocked_slots")
    .select("*")
    .eq("business_id", business.id)
    .order("date");

  if (month) {
    query = query.gte("date", `${month}-01`).lte("date", `${month}-31`);
  }

  const { data } = await query;
  res.json(data || []);
});

// POST /api/blocked-slots — Bloquear día o rango de horas
blockedSlotsRouter.post("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { date, start_time, end_time, reason } = req.body;

  if (!date) return res.status(400).json({ error: "date es requerido (YYYY-MM-DD)" });

  const { data: business } = await supabaseAdmin
    .from("businesses").select("id").eq("user_id", userId).single();
  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  const { data, error } = await supabaseAdmin
    .from("blocked_slots")
    .insert({
      business_id: business.id,
      date,
      start_time: start_time || null,   // null = todo el día
      end_time: end_time || null,
      reason: reason || null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/blocked-slots/:id — Desbloquear
blockedSlotsRouter.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const { data: business } = await supabaseAdmin
    .from("businesses").select("id").eq("user_id", userId).single();
  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  const { error } = await supabaseAdmin
    .from("blocked_slots")
    .delete()
    .eq("id", req.params.id as string)
    .eq("business_id", business.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});

// ============================================
// APPOINTMENTS RANGE
// ============================================
// GET /api/appointments/range?start=2026-04-01&end=2026-04-30
appointmentsRouter.get("/range", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { start, end } = req.query as { start: string; end: string };
  if (!start || !end) return res.status(400).json({ error: "start y end requeridos (YYYY-MM-DD)" });

  const { data: business } = await supabaseAdmin
    .from("businesses").select("id").eq("user_id", userId).single();
  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("*")
    .eq("business_id", business.id)
    .gte("datetime", `${start}T00:00:00`)
    .lte("datetime", `${end}T23:59:59`)
    .order("datetime");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// ============================================
// SERVICES ROUTER
// ============================================
export const servicesRouter = Router();

// GET /api/services
servicesRouter.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { data: business } = await supabaseAdmin
    .from("businesses").select("id").eq("user_id", userId).single();
  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  const { data, error } = await supabaseAdmin
    .from("services").select("*").eq("business_id", business.id).order("created_at");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST /api/services
servicesRouter.post("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { name, description, price, duration_minutes, active } = req.body;
  if (!name || !price) return res.status(400).json({ error: "name y price requeridos" });

  const { data: business } = await supabaseAdmin
    .from("businesses").select("id").eq("user_id", userId).single();
  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  const { data, error } = await supabaseAdmin
    .from("services").insert({
      business_id: business.id, name, description: description || null,
      price: parseFloat(price), duration_minutes: duration_minutes || 30,
      active: active !== false,
    }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT /api/services/:id
servicesRouter.put("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { name, description, price, duration_minutes, active } = req.body;

  const { data: business } = await supabaseAdmin
    .from("businesses").select("id").eq("user_id", userId).single();
  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = parseFloat(price);
  if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
  if (active !== undefined) updates.active = active;

  const { data, error } = await supabaseAdmin
    .from("services").update(updates)
    .eq("id", req.params.id).eq("business_id", business.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/services/:id
servicesRouter.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { data: business } = await supabaseAdmin
    .from("businesses").select("id").eq("user_id", userId).single();
  if (!business) return res.status(404).json({ error: "Negocio no encontrado" });

  const { error } = await supabaseAdmin
    .from("services").delete()
    .eq("id", req.params.id).eq("business_id", business.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});
