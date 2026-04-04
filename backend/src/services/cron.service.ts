import { supabaseAdmin } from "../config/supabase";
import { env } from "../config/env";
import { sendDay2Email, sendDay5Email } from "./welcome.service";
import { cleanOldRateLimits } from "./ratelimit.service";

// ============================================
// CLEO — Cron Job: Trial Expiration & Cleanup
// Corre cada 24 horas
// ============================================

async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log(`📧 [DRY RUN] To: ${to} | Subject: ${subject}`);
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Cleo <hola@cleoia.app>", to: [to], subject, text }),
  });
}

/**
 * Enviar recordatorio por WhatsApp usando Meta Cloud API.
 * Fallback: email si no hay token configurado.
 */
async function sendWhatsAppReminder(
  phone: string,
  message: string,
  fallbackEmail?: string,
  fallbackSubject?: string
): Promise<"whatsapp" | "email" | "none"> {
  if (env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_ID) {
    try {
      const phoneClean = phone.replace(/[^0-9]/g, "");
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phoneClean,
            type: "text",
            text: { body: message },
          }),
        }
      );
      if (res.ok) return "whatsapp";
      const err = await res.json();
      console.warn(`⚠️ WhatsApp falló para ${phone}:`, err);
    } catch (err) {
      console.warn(`⚠️ Error WhatsApp para ${phone}:`, err);
    }
  }

  // Fallback a email si está disponible
  if (fallbackEmail && fallbackSubject) {
    await sendEmail(fallbackEmail, fallbackSubject, message);
    return "email";
  }

  return "none";
}

// ============================================
// RECORDATORIOS DE CITAS
// Corre cada hora (o cada 30 min para mayor precisión)
//
// REQUIERE en tabla appointments:
//   reminder_12h_sent  BOOLEAN DEFAULT FALSE
//   reminder_1h_sent   BOOLEAN DEFAULT FALSE
//
// REQUIERE en env:
//   WHATSAPP_TOKEN     — Bearer token de Meta Cloud API
//   WHATSAPP_PHONE_ID  — ID del número de WhatsApp Business
// ============================================
export async function runAppointmentReminders(): Promise<void> {
  console.log("⏰ Ejecutando recordatorios de citas...");
  const now = new Date();

  // Traer citas con datos del negocio (para nombre y email de fallback)
  const { data: appointments, error } = await supabaseAdmin
    .from("appointments")
    .select(`
      id,
      business_id,
      client_name,
      client_phone,
      date_time,
      status,
      reminder_12h_sent,
      reminder_1h_sent,
      businesses ( business_name, email )
    `)
    .eq("status", "confirmed")
    .gte("date_time", now.toISOString());

  if (error) {
    console.error("❌ Error al obtener citas:", error);
    return;
  }

  if (!appointments || appointments.length === 0) {
    console.log("✅ Sin citas próximas para recordar");
    return;
  }

  let sent12h = 0;
  let sent1h = 0;

  for (const appt of appointments) {
    const apptDate = new Date(appt.date_time);
    const diffMs = apptDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const biz = appt.businesses as { business_name: string; email: string } | null;
    const bizName = biz?.business_name ?? "tu negocio";
    const bizEmail = biz?.email;

    const horaStr = apptDate.toLocaleTimeString("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const fechaStr = apptDate.toLocaleDateString("es-EC", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    // ── RECORDATORIO 12 HORAS ANTES ──────────────────────────────
    // Ventana: entre 11h y 13h antes de la cita
    if (diffHours >= 11 && diffHours <= 13 && !appt.reminder_12h_sent) {
      const mensaje =
        `Hola ${appt.client_name} 👋, te recordamos que tienes una cita *mañana ${fechaStr}* a las *${horaStr}* en *${bizName}*. ¡Te esperamos!`;

      const canal = await sendWhatsAppReminder(
        appt.client_phone,
        mensaje,
        bizEmail,
        `Recordatorio de cita — ${bizName}`
      );

      if (canal !== "none") {
        await supabaseAdmin
          .from("appointments")
          .update({ reminder_12h_sent: true })
          .eq("id", appt.id);
        sent12h++;
        console.log(`📱 Recordatorio 12h → ${appt.client_name} (${canal})`);
      }
    }

    // ── RECORDATORIO 1 HORA ANTES ────────────────────────────────
    // Ventana: entre 45min y 75min antes de la cita
    if (diffHours >= 0.75 && diffHours <= 1.25 && !appt.reminder_1h_sent) {
      const mensaje =
        `Hola ${appt.client_name} 👋, tu cita en *${bizName}* es *en 1 hora* (a las *${horaStr}*). ¡Hasta pronto!`;

      const canal = await sendWhatsAppReminder(
        appt.client_phone,
        mensaje,
        bizEmail,
        `Tu cita en ${bizName} es en 1 hora`
      );

      if (canal !== "none") {
        await supabaseAdmin
          .from("appointments")
          .update({ reminder_1h_sent: true })
          .eq("id", appt.id);
        sent1h++;
        console.log(`📱 Recordatorio 1h → ${appt.client_name} (${canal})`);
      }
    }
  }

  console.log(`✅ Recordatorios enviados: ${sent12h} de 12h, ${sent1h} de 1h`);
}

/**
 * Ejecutar diariamente — verifica trials vencidos, envía emails, elimina cuentas
 */
export async function runDailyCleanup(): Promise<void> {
  console.log("🔄 Ejecutando limpieza diaria...");
  const now = new Date();

  // 1. Buscar cuentas con trial vencido que aún no se eliminaron
  const { data: expired } = await supabaseAdmin
    .from("businesses")
    .select("id, email, business_name, trial_ends_at, grace_period_ends_at, retention_emails_sent, messages_used")
    .eq("plan", "trial")
    .is("deleted_at", null)
    .lt("trial_ends_at", now.toISOString());

  if (!expired || expired.length === 0) {
    console.log("✅ No hay cuentas vencidas");
    return;
  }

  for (const biz of expired) {
    const trialEnd = new Date(biz.trial_ends_at);
    const daysSinceExpiry = Math.floor((now.getTime() - trialEnd.getTime()) / (1000 * 60 * 60 * 24));
    const graceEnd = new Date(biz.grace_period_ends_at);

    if (daysSinceExpiry >= 1 && biz.retention_emails_sent < 1) {
      await sendEmail(biz.email,
        "Tu prueba terminó — tus datos siguen aquí",
        [`Hola,`, ``, `Tu prueba gratuita de Cleo terminó.`, ``, `Durante tu prueba:`, `• Cleo respondió ${biz.messages_used} mensajes`, `• Tu negocio "${biz.business_name}" estuvo atendido 24/7`, ``, `Tus datos están seguros. Elige un plan para seguir usando Cleo.`, ``, `— Cleo`].join("\n")
      );
      await supabaseAdmin.from("businesses").update({ retention_emails_sent: 1 }).eq("id", biz.id);
      console.log(`📧 Email 1 enviado a ${biz.email}`);
    }

    if (daysSinceExpiry >= 7 && biz.retention_emails_sent < 2) {
      await sendEmail(biz.email,
        "Cleo sigue guardando tu lugar",
        [`Hola,`, ``, `Han pasado ${daysSinceExpiry} días desde que terminó tu prueba de Cleo.`, ``, `Mientras no tienes Cleo activo, los mensajes de tus clientes en WhatsApp se quedan sin responder.`, `Cada mensaje sin respuesta es un cliente que se va.`, ``, `Tus datos siguen intactos. Reactiva tu cuenta con un plan desde $29/mes.`, ``, `— Cleo`].join("\n")
      );
      await supabaseAdmin.from("businesses").update({ retention_emails_sent: 2 }).eq("id", biz.id);
      console.log(`📧 Email 2 enviado a ${biz.email}`);
    }

    if (daysSinceExpiry >= 25 && biz.retention_emails_sent < 3) {
      const deleteDate = graceEnd.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });
      await sendEmail(biz.email,
        "Últimos días — eliminamos tu cuenta en 5 días",
        [`Hola,`, ``, `El ${deleteDate} eliminaremos permanentemente todos los datos de "${biz.business_name}" en Cleo.`, ``, `Esto incluye: citas, conversaciones, servicios y toda tu configuración.`, ``, `Esta acción no se puede deshacer. Si quieres conservar tu cuenta, elige un plan ahora.`, ``, `— Cleo`].join("\n")
      );
      await supabaseAdmin.from("businesses").update({ retention_emails_sent: 3 }).eq("id", biz.id);
      console.log(`📧 Email 3 (urgencia) enviado a ${biz.email}`);
    }

    if (now > graceEnd) {
      console.log(`🗑️ Eliminando cuenta: ${biz.business_name} (${biz.email})`);
      const { data: fullBiz } = await supabaseAdmin.from("businesses").select("user_id").eq("id", biz.id).single();
      await supabaseAdmin.from("businesses").update({ deleted_at: now.toISOString() }).eq("id", biz.id);
      await supabaseAdmin.from("blocked_slots").delete().eq("business_id", biz.id);
      await supabaseAdmin.from("conversations").delete().eq("business_id", biz.id);
      await supabaseAdmin.from("appointments").delete().eq("business_id", biz.id);
      await supabaseAdmin.from("whatsapp_connections").delete().eq("business_id", biz.id);
      await supabaseAdmin.from("services").delete().eq("business_id", biz.id);
      await supabaseAdmin.from("businesses").delete().eq("id", biz.id);
      if (fullBiz?.user_id) await supabaseAdmin.auth.admin.deleteUser(fullBiz.user_id);
      await sendEmail(biz.email, "Tu cuenta de Cleo fue eliminada", [`Hola,`, ``, `Tu cuenta de Cleo para "${biz.business_name}" fue eliminada permanentemente.`, ``, `Todos los datos fueron borrados: citas, conversaciones, servicios y configuración.`, ``, `Si quieres volver a empezar, puedes registrarte cuando quieras en cleoia.app`, ``, `— Cleo`].join("\n"));
      console.log(`✅ Cuenta eliminada: ${biz.email}`);
    }
  }

  console.log("🔄 Limpieza diaria completada");

  const { data: cancelled } = await supabaseAdmin.from("businesses").select("id, email, business_name, cancelled_at, messages_used, retention_emails_sent").not("cancelled_at", "is", null).is("deleted_at", null);
  if (cancelled && cancelled.length > 0) {
    for (const biz of cancelled) {
      const cancelDate = new Date(biz.cancelled_at);
      const daysSinceCancel = Math.floor((now.getTime() - cancelDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceCancel >= 3 && biz.retention_emails_sent < 10) {
        await sendEmail(biz.email, "¿Qué salió mal? (1 sola pregunta)", [`Hola,`, ``, `Cancelaste tu cuenta de Cleo hace 3 días.`, ``, `Para mejorar solo necesitamos saber una cosa:`, `¿Qué pasó? Puedes responder a este email directamente.`, ``, `Sin presión, sin ofertas. Solo queremos entender.`, ``, `— Cleo`].join("\n"));
        await supabaseAdmin.from("businesses").update({ retention_emails_sent: 10 }).eq("id", biz.id);
      }
      if (daysSinceCancel >= 15 && biz.retention_emails_sent < 11) {
        await sendEmail(biz.email, "Tu negocio sigue esperándote en Cleo", [`Hola,`, ``, `Mientras estuviste con nosotros, Cleo respondió ${biz.messages_used} mensajes en "${biz.business_name}".`, ``, `Tus datos siguen aquí. Puedes reactivar tu cuenta en cualquier momento.`, ``, `— Cleo`].join("\n"));
        await supabaseAdmin.from("businesses").update({ retention_emails_sent: 11 }).eq("id", biz.id);
      }
    }
  }

  const { data: paused } = await supabaseAdmin.from("businesses").select("id, email, business_name, paused_until").not("paused_until", "is", null).lt("paused_until", now.toISOString());
  if (paused && paused.length > 0) {
    for (const biz of paused) {
      await supabaseAdmin.from("businesses").update({ paused_until: null }).eq("id", biz.id);
      await sendEmail(biz.email, "Tu cuenta de Cleo fue reactivada", `Hola,\n\nTu pausa terminó y "${biz.business_name}" está de vuelta en Cleo. Tu IA ya está respondiendo mensajes.\n\n— Cleo`);
      console.log(`▶️ Cuenta reactivada: ${biz.email}`);
    }
  }

  const { data: downgrades } = await supabaseAdmin.from("businesses").select("id, email, business_name, pending_downgrade, billing_period_ends_at").not("pending_downgrade", "is", null).lt("billing_period_ends_at", now.toISOString());
  if (downgrades && downgrades.length > 0) {
    const planLimits: Record<string, number> = { basico: 500, negocio: 2000, pro: 99999 };
    for (const biz of downgrades) {
      await supabaseAdmin.from("businesses").update({ plan: biz.pending_downgrade, pending_downgrade: null, messages_used: 0, messages_limit: planLimits[biz.pending_downgrade] || 500 }).eq("id", biz.id);
      console.log(`⬇️ Downgrade aplicado: ${biz.email} → ${biz.pending_downgrade}`);
    }
  }

  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const twoDaysAgoStart = new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate()).toISOString();
  const twoDaysAgoEnd = new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate() + 1).toISOString();
  const { data: day2Users } = await supabaseAdmin.from("businesses").select("id").eq("plan", "trial").gte("created_at", twoDaysAgoStart).lt("created_at", twoDaysAgoEnd).filter("retention_emails_sent", "not.cs", '{"day2"}');
  if (day2Users) {
    for (const u of day2Users) {
      await sendDay2Email(u.id);
      await supabaseAdmin.rpc("append_retention_email", { p_business_id: u.id, p_tag: "day2" });
    }
  }

  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const fiveDaysAgoStart = new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate()).toISOString();
  const fiveDaysAgoEnd = new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate() + 1).toISOString();
  const { data: day5Users } = await supabaseAdmin.from("businesses").select("id").eq("plan", "trial").gte("created_at", fiveDaysAgoStart).lt("created_at", fiveDaysAgoEnd).filter("retention_emails_sent", "not.cs", '{"day5"}');
  if (day5Users) {
    for (const u of day5Users) {
      await sendDay5Email(u.id);
      await supabaseAdmin.rpc("append_retention_email", { p_business_id: u.id, p_tag: "day5" });
    }
  }

  await cleanOldRateLimits();

  const { data: annualExpired } = await supabaseAdmin.from("businesses").select("id, email, business_name").eq("cancel_at_period_end", true).lt("plan_renews_at", now.toISOString());
  if (annualExpired) {
    for (const biz of annualExpired) {
      await supabaseAdmin.from("businesses").update({ cancel_at_period_end: false, plan: "trial", trial_ends_at: null, grace_period_ends_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() }).eq("id", biz.id);
      console.log(`📅 Plan anual vencido, gracia iniciada: ${biz.email}`);
    }
  }
}
