import { env } from "../config/env";
import { supabaseAdmin } from "../config/supabase";

// ============================================
// CLEO — Servicio de Email (Resend)
// ============================================

/**
 * Notificar al dueño del negocio cuando la IA agenda una cita.
 * Se ejecuta en background — no bloquea el flujo de WhatsApp.
 */
export async function notifyNewAppointment(
  businessId: string,
  clientName: string,
  datetime: string,
  durationMinutes: number
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY no configurada — email no enviado");
    return;
  }

  try {
    // Obtener email del dueño
    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("email, business_name")
      .eq("id", businessId)
      .single();

    if (!business?.email) return;

    const date = new Date(datetime);
    const fechaStr = date.toLocaleDateString("es-EC", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const horaStr = date.toLocaleTimeString("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const subject = `Nueva cita — ${clientName} el ${fechaStr} a las ${horaStr}`;

    const body = [
      `Hola,`,
      ``,
      `Tu asistente Cleo agendó una nueva cita:`,
      ``,
      `Cliente: ${clientName}`,
      `Fecha: ${fechaStr}`,
      `Hora: ${horaStr}`,
      `Duración: ${durationMinutes} minutos`,
      ``,
      `La cita ya está confirmada. Puedes verla en tu panel de Cleo.`,
      ``,
      `— Cleo, asistente de ${business.business_name}`,
    ].join("\n");

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.NOTIFICATION_FROM_EMAIL,
        to: [business.email],
        subject,
        text: body,
      }),
    });

    console.log(`📧 Email enviado a ${business.email}: ${subject}`);
  } catch (error) {
    // No lanzar error — el email no es crítico
    console.error("Error enviando email de notificación:", error);
  }
}
