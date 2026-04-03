import { env } from "../config/env";
import { supabaseAdmin } from "../config/supabase";

// ============================================
// WELCOME EMAILS — Secuencia de 3 emails
// ============================================

async function sendEmail(to: string, subject: string, text: string) {
  if (!env.RESEND_API_KEY) { console.warn("⚠️ RESEND no configurada —", subject); return; }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Cleo <hola@cleo.app>", to: [to], subject, text }),
  });
}

// Email 1 — inmediato al registrarse
export async function sendWelcomeEmail(businessName: string, email: string) {
  await sendEmail(email,
    "Bienvenido a Cleo 🎉 — Tu prueba de 7 días empieza ahora",
    [
      `¡Hola ${businessName}!`,
      "",
      "Tu cuenta de Cleo está lista. Tienes 7 días gratis con acceso completo.",
      "",
      "3 pasos para activar tu asistente IA:",
      "1. Configura tu negocio (nombre, horarios, servicios)",
      "2. Conecta tu WhatsApp Business",
      "3. ¡Listo! Tu IA empieza a responder",
      "",
      "Ir a mi dashboard: https://app.cleo.app/dashboard",
      "",
      "— El equipo de Cleo",
    ].join("\n")
  );
}

// Email 2 — día 2 (personalizado según estado de WA)
export async function sendDay2Email(businessId: string) {
  const { data: biz } = await supabaseAdmin
    .from("businesses").select("email, business_name")
    .eq("id", businessId).single();
  if (!biz) return;

  const { data: wa } = await supabaseAdmin
    .from("whatsapp_connections").select("id")
    .eq("business_id", businessId).limit(1).single();

  if (!wa) {
    // No conectó WA
    await sendEmail(biz.email,
      "¿Ya conectaste tu WhatsApp? 📱",
      [
        `Hola ${biz.business_name},`,
        "",
        "Conectar tu WhatsApp es el paso más importante — sin él la IA no puede responder a tus clientes.",
        "",
        "Solo toma 2 minutos:",
        "1. Entra a tu dashboard",
        "2. Ve a Ajustes → WhatsApp",
        "3. Sigue las instrucciones de conexión",
        "",
        "Conectar ahora: https://app.cleo.app/dashboard",
        "",
        "— El equipo de Cleo",
      ].join("\n")
    );
  } else {
    // Ya conectó — tip de servicios
    await sendEmail(biz.email,
      "Tu IA responde mejor con servicios configurados 💡",
      [
        `Hola ${biz.business_name},`,
        "",
        "Tu WhatsApp ya está conectado — genial! 🎉",
        "",
        "Tip: tu IA responde mejor cuando configuras tus servicios con precios.",
        "Así puede decirle a tus clientes cuánto cuesta cada servicio y agendar directamente.",
        "",
        "Agregar mis servicios: https://app.cleo.app/dashboard",
        "",
        "— El equipo de Cleo",
      ].join("\n")
    );
  }
}

// Email 3 — día 5 (quedan 2 días, mostrar métricas)
export async function sendDay5Email(businessId: string) {
  const { data: biz } = await supabaseAdmin
    .from("businesses").select("email, business_name, messages_used")
    .eq("id", businessId).single();
  if (!biz) return;

  const { count: apptCount } = await supabaseAdmin
    .from("appointments").select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  await sendEmail(biz.email,
    "Te quedan 2 días de prueba gratuita",
    [
      `Hola ${biz.business_name},`,
      "",
      `En estos días Cleo respondió ${biz.messages_used || 0} mensajes y agendó ${apptCount || 0} citas por ti.`,
      "",
      "Para seguir con tu asistente IA elige tu plan:",
      "",
      "Básico — $29/mes (hasta 500 conversaciones)",
      "Negocio — $59/mes (hasta 2,000 conversaciones) ← Recomendado",
      "Pro — $99/mes (conversaciones ilimitadas)",
      "",
      "Elegir plan: https://app.cleo.app/dashboard",
      "",
      "— El equipo de Cleo",
    ].join("\n")
  );
}
