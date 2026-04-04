import axios from "axios";
import { supabaseAdmin } from "../config/supabase";
import { processMessage } from "./ai.service";
import { createAppointment, cancelAppointment } from "./appointments.service";
import { notifyNewAppointment } from "./email.service";
import { checkRateLimit } from "./ratelimit.service";

// ============================================
// CLEO — Servicio WhatsApp Cloud API
// NO Twilio. Solo Meta Cloud API.
// Maneja gracefully cuando WA no está configurado
// ============================================

const GRAPH_API = "https://graph.facebook.com/v19.0";

/**
 * Verifica si WhatsApp está configurado y listo
 * Retorna false si los valores son "pendiente" o vacíos
 */
export function isWhatsAppReady(): boolean {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  return !!(token && token !== "pendiente" && appSecret && appSecret !== "pendiente");
}

// --- Tipos ---

export interface WebhookBody {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: { body: string };
          type: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

/**
 * Verificación del webhook (GET) — requerido por Meta
 */
export function verifyWebhook(mode: string, token: string, challenge: string, verifyToken: string): string | null {
  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ Webhook verificado con Meta");
    return challenge;
  }
  return null;
}

/**
 * Procesar mensaje entrante — orquesta todo el flujo:
 * mensaje → IA → agendar si aplica → responder
 */
export async function handleIncomingMessage(body: WebhookBody): Promise<void> {
  if (!isWhatsAppReady()) {
    console.warn("⚠️ WhatsApp no configurado — mensaje recibido pero no procesado");
    return;
  }

  const value = body.entry?.[0]?.changes?.[0]?.value;
  if (!value?.messages?.[0]) return;

  const message = value.messages[0];
  const contact = value.contacts?.[0];
  const phoneNumberId = value.metadata.phone_number_id;
  const clientPhone = message.from;
  const clientName = contact?.profile?.name || "Cliente";
  const messageText = message.text?.body;

  if (message.type !== "text" || !messageText) {
    await sendTextMessage(phoneNumberId, clientPhone, "Por ahora solo puedo procesar mensajes de texto. ¿En qué te puedo ayudar? 😊");
    return;
  }

  console.log(`📨 ${clientName} (***${clientPhone.slice(-4)}): ${messageText.slice(0, 50)}...`);

  try {
    // 1. Identificar negocio por phone_number_id
    const connection = await getConnectionByPhoneId(phoneNumberId);
    if (!connection) {
      console.error("Negocio no encontrado para phone_id:", phoneNumberId);
      return;
    }

    // 2. Verificar límite de mensajes y trial
    const business = await getBusiness(connection.business_id);
    if (!business) return;

    // Trial vencido y sin plan pago → dejar de responder
    if (business.plan === "trial" && new Date(business.trial_ends_at) < new Date()) {
      await sendTextMessage(phoneNumberId, clientPhone,
        "Gracias por tu mensaje. Este negocio está actualizando su sistema de atención. Por favor intenta más tarde o contáctanos directamente.");
      return;
    }

    if (business.messages_used >= business.messages_limit) {
      await sendTextMessage(phoneNumberId, clientPhone,
        "El negocio ha alcanzado su límite de conversaciones este mes. Por favor contáctanos directamente.");
      return;
    }

    // 3. Rate limiting
    const rateCheck = await checkRateLimit(connection.business_id, clientPhone);
    if (!rateCheck.allowed) {
      await sendTextMessage(phoneNumberId, clientPhone, rateCheck.message || "Por favor espera un momento.");
      return;
    }

    // 4. Procesar con IA (Claude)
    const aiResult = await processMessage(
      connection.business_id,
      clientPhone,
      clientName,
      messageText
    );

    // 4. Si la IA agendó una cita → crear en DB
    if (aiResult.appointmentToCreate) {
      const appt = aiResult.appointmentToCreate;
      const result = await createAppointment(
        connection.business_id,
        clientPhone,
        appt.client_name,
        appt.datetime,
        appt.duration_minutes,
        "ia"
      );

      if (!result.success) {
        // Si hubo conflicto, avisar al cliente
        await sendTextMessage(phoneNumberId, clientPhone,
          "Lo siento, ese horario acaba de ser ocupado. ¿Te parece otro horario? 😊");
        return;
      }

      // Notificar al dueño por email (background, no bloquea)
      notifyNewAppointment(
        connection.business_id,
        appt.client_name,
        appt.datetime,
        appt.duration_minutes
      ).catch(err => console.error("Error notificación email:", err));
    }

    // 5. Si hay cancelación
    if (aiResult.appointmentToCancel) {
      await cancelAppointment(aiResult.appointmentToCancel, connection.business_id);
    }

    // 6. Enviar respuesta al cliente
    await sendTextMessage(phoneNumberId, clientPhone, aiResult.reply);

    // 7. Marcar como leído
    await markAsRead(phoneNumberId, message.id, connection.access_token);

  } catch (error) {
    console.error("Error procesando mensaje:", error);
    await sendTextMessage(phoneNumberId, clientPhone,
      "Disculpa, tuve un inconveniente técnico. Un agente te contactará pronto. 🙏");
  }
}

/**
 * Enviar mensaje de texto por WhatsApp
 */
async function sendTextMessage(phoneNumberId: string, to: string, text: string): Promise<void> {
  // Obtener token del negocio
  const { data: conn } = await supabaseAdmin
    .from("whatsapp_connections")
    .select("access_token")
    .eq("phone_number_id", phoneNumberId)
    .eq("active", true)
    .single();

  if (!conn) {
    console.error("No se encontró conexión activa para phone_id:", phoneNumberId);
    return;
  }

  try {
    await axios.post(
      `${GRAPH_API}/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: text },
      },
      { headers: { Authorization: `Bearer ${conn.access_token}`, "Content-Type": "application/json" } }
    );
    console.log(`📤 Respuesta enviada a ***${to.slice(-4)}`);
  } catch (error: any) {
    console.error("Error enviando WA:", error.response?.data || error.message);
  }
}

/**
 * Enviar mensaje de prueba al conectar WhatsApp
 */
export async function sendTestMessage(
  phoneNumberId: string,
  to: string,
  accessToken: string,
  businessName: string
): Promise<void> {
  try {
    await axios.post(
      `${GRAPH_API}/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: `✅ ¡Conexión exitosa! Soy el asistente de ${businessName}. A partir de ahora responderé tus mensajes automáticamente.`,
        },
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  } catch (error: any) {
    console.error("Error enviando mensaje de prueba:", error.response?.data || error.message);
  }
}

/**
 * Marcar mensaje como leído
 */
async function markAsRead(phoneNumberId: string, messageId: string, accessToken: string): Promise<void> {
  try {
    await axios.post(
      `${GRAPH_API}/${phoneNumberId}/messages`,
      { messaging_product: "whatsapp", status: "read", message_id: messageId },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  } catch { /* no crítico */ }
}

// --- DB Helpers ---

async function getConnectionByPhoneId(phoneNumberId: string) {
  const { data } = await supabaseAdmin
    .from("whatsapp_connections")
    .select("business_id, access_token")
    .eq("phone_number_id", phoneNumberId)
    .eq("active", true)
    .single();
  return data;
}

async function getBusiness(id: string) {
  const { data } = await supabaseAdmin
    .from("businesses")
    .select("messages_used, messages_limit, plan, trial_ends_at, email, business_name")
    .eq("id", id)
    .single();
  return data;
}

// Verifica límites de conversación y envía alertas al 80% y 100%
async function checkConversationLimits(businessId: string): Promise<void> {
  const biz = await getBusiness(businessId);
  if (!biz || biz.plan === "pro" || biz.messages_limit === 0) return;

  const pct = biz.messages_used / biz.messages_limit;
  const nextPlan = biz.plan === "basico" ? "Negocio ($59/mes)" : "Pro ($99/mes)";

  // Alerta al 80%
  if (pct >= 0.8 && pct < 1) {
    // Solo enviar si no se ha enviado antes (check con un campo o simplemente al cruzar 80%)
    if (biz.messages_used === Math.floor(biz.messages_limit * 0.8)) {
      await sendLimitEmail(biz.email, biz.business_name,
        `Llevas el 80% de tus conversaciones`,
        `Llevas ${biz.messages_used} de ${biz.messages_limit} conversaciones este mes en "${biz.business_name}". Considera cambiar al plan ${nextPlan} para no interrumpir el servicio.`
      );
    }
  }

  // Alerta al 100%
  if (pct >= 1) {
    if (biz.messages_used === biz.messages_limit) {
      await sendLimitEmail(biz.email, biz.business_name,
        `Tu IA pausó las respuestas automáticas`,
        `Alcanzaste el límite de ${biz.messages_limit} conversaciones del mes en "${biz.business_name}". Tu IA dejó de responder. Actualiza al plan ${nextPlan} para reactivarla.`
      );
    }
  }
}

async function sendLimitEmail(to: string, bizName: string, subject: string, body: string): Promise<void> {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Cleo <hola@cleoia.app>", to: [to], subject, text: body + "\n\n— Cleo" }),
  });
}
