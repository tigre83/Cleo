import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import { supabaseAdmin } from "../config/supabase";

// ============================================
// CLEO — Servicio de IA Conversacional
// Claude API como motor principal
// ============================================

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// --- Tipos ---

interface Business {
  id: string;
  business_name: string;
  business_type: string;
  schedule: Record<string, { open: string; close: string; active: boolean }>;
  appointment_duration: number;
  assistant_name: string | null;
}

interface Appointment {
  client_name: string;
  datetime: string;   // ISO
  duration_minutes: number;
}

interface AIResponse {
  reply: string;                          // texto limpio para enviar al cliente
  appointmentToCreate: Appointment | null; // si la IA agendó algo
  appointmentToCancel: string | null;      // appointment_id si hay cancelación
}

// --- System Prompt Builder ---

function buildSystemPrompt(
  business: Business,
  todayAppointments: Array<{ datetime: string; client_name: string; status: string }>,
  now: Date
): string {
  const dayNames: Record<string, string> = {
    "0": "domingo", "1": "lunes", "2": "martes", "3": "miercoles",
    "4": "jueves", "5": "viernes", "6": "sabado",
  };
  const today = dayNames[now.getDay().toString()];
  const dateStr = now.toLocaleDateString("es-EC", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const scheduleStr = Object.entries(business.schedule)
    .filter(([, v]) => v.active)
    .map(([day, v]) => `  ${day}: ${v.open} — ${v.close}`)
    .join("\n");

  const appointmentsStr = todayAppointments.length > 0
    ? todayAppointments
        .filter(a => a.status === "confirmed")
        .map(a => {
          const time = new Date(a.datetime).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
          return `  ${time} — ${a.client_name}`;
        })
        .join("\n")
    : "  (Sin citas agendadas)";

  const name = business.assistant_name || `Asistente de ${business.business_name}`;

  return `Eres ${name}, el asistente virtual de "${business.business_name}", un negocio de ${business.business_type} en Ecuador.

Hoy es ${dateStr}.

Tu función es responder consultas de clientes y agendar citas de forma automática, en español ecuatoriano, con un tono amigable y profesional.

HORARIOS DE ATENCIÓN:
${scheduleStr}

DURACIÓN DE CADA CITA: ${business.appointment_duration} minutos

CITAS YA AGENDADAS HOY:
${appointmentsStr}

REGLAS:
1. Solo agenda citas dentro del horario de atención.
2. No ofrezcas horarios ya ocupados. Calcula los bloques disponibles considerando la duración de cada cita (${business.appointment_duration} min).
3. Cuando confirmes una cita, SIEMPRE incluye este tag exacto en tu respuesta:
   [AGENDAR: nombre_cliente, YYYY-MM-DD, HH:MM]
   Ejemplo: [AGENDAR: María López, 2026-04-05, 11:30]
4. Si el cliente quiere cancelar una cita existente, responde con:
   [CANCELAR: appointment_id]
5. Para preguntas fuera de tu alcance, di amablemente que el equipo del negocio responderá pronto.
6. Sé conciso — máximo 2-3 párrafos. Los mensajes de WhatsApp deben ser breves.
7. Usa emojis con moderación (1-2 por mensaje).
8. NUNCA inventes información sobre precios o servicios que no estén en tu contexto.
9. Siempre confirma nombre y hora antes de agendar.`;
}

// --- Core: Procesar Mensaje ---

export async function processMessage(
  businessId: string,
  clientPhone: string,
  clientName: string,
  messageText: string
): Promise<AIResponse> {
  // 1. Cargar negocio
  const business = await getBusiness(businessId);
  if (!business) {
    return { reply: "Lo siento, no pude conectar con el negocio. Intenta más tarde.", appointmentToCreate: null, appointmentToCancel: null };
  }

  // 2. Cargar/crear conversación
  const conversation = await getOrCreateConversation(businessId, clientPhone, clientName);

  // 3. Cargar citas de hoy
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  const { data: todayAppts } = await supabaseAdmin
    .from("appointments")
    .select("datetime, client_name, status")
    .eq("business_id", businessId)
    .gte("datetime", todayStart)
    .lt("datetime", todayEnd)
    .order("datetime");

  // 4. Construir mensajes para Claude
  const history = (conversation.messages || []).slice(-16); // últimas 16 interacciones
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...history,
    { role: "user", content: messageText },
  ];

  // 5. Llamar Claude API con retry + timeout
  const FALLBACK_MSG = "Hola, en este momento nuestro asistente está experimentando una interrupción. Un miembro de nuestro equipo te responderá pronto. Disculpa las molestias 🙏";

  const callClaude = async (): Promise<string> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    try {
      const response = await anthropic.messages.create({
        model: env.ANTHROPIC_MODEL,
        max_tokens: 600,
        system: buildSystemPrompt(business, todayAppts || [], now),
        messages,
      });
      clearTimeout(timeout);
      return response.content[0]?.type === "text" ? response.content[0].text : "";
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  };

  try {
    let fullResponse: string;
    try {
      fullResponse = await callClaude();
    } catch (firstError) {
      console.warn("Claude API primer intento falló, reintentando en 2s...", firstError);
      await new Promise(r => setTimeout(r, 2000));
      try {
        fullResponse = await callClaude();
      } catch (retryError) {
        // Ambos intentos fallaron — enviar fallback + alerta
        console.error("Claude API falló después de 2 intentos:", retryError);

        // Email de alerta a soporte
        if (env.RESEND_API_KEY) {
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Cleo Alertas <alertas@cleoia.app>", to: ["soporte@cleoia.app"],
              subject: `⚠️ Claude API caída — ${business.business_name}`,
              text: [
                `Negocio: ${business.business_name} (${businessId})`,
                `Cliente: ${clientPhone}`,
                `Mensaje: ${messageText}`,
                `Error: ${retryError instanceof Error ? retryError.message : String(retryError)}`,
                `Timestamp: ${new Date().toISOString()}`,
              ].join("\n"),
            }),
          }).catch(e => console.error("Error enviando alerta:", e));
        }

        return { reply: FALLBACK_MSG, appointmentToCreate: null, appointmentToCancel: null };
      }
    }

    // 6. Parsear tags [AGENDAR] y [CANCELAR]
    const { cleanReply, appointment, cancelId } = parseTags(fullResponse, business.appointment_duration);

    // 7. Guardar mensajes en la conversación
    const updatedMessages = [
      ...history,
      { role: "user", content: messageText, timestamp: now.toISOString() },
      { role: "assistant", content: cleanReply, timestamp: new Date().toISOString() },
    ];

    await supabaseAdmin
      .from("conversations")
      .update({ messages: updatedMessages, last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);

    // 8. Incrementar contador de mensajes
    await supabaseAdmin.rpc("increment_message_count", { p_business_id: businessId });

    return {
      reply: cleanReply,
      appointmentToCreate: appointment,
      appointmentToCancel: cancelId,
    };
  } catch (error) {
    console.error("Error inesperado en AI service:", error);
    return {
      reply: FALLBACK_MSG,
      appointmentToCreate: null,
      appointmentToCancel: null,
    };
  }
}

// --- Parsear [AGENDAR] y [CANCELAR] ---

function parseTags(
  response: string,
  defaultDuration: number
): { cleanReply: string; appointment: Appointment | null; cancelId: string | null } {
  let appointment: Appointment | null = null;
  let cancelId: string | null = null;

  // Buscar [AGENDAR: nombre, fecha, hora]
  const agendarMatch = response.match(/\[AGENDAR:\s*(.+?),\s*(\d{4}-\d{2}-\d{2}),\s*(\d{2}:\d{2})\]/);
  if (agendarMatch) {
    const [, name, date, time] = agendarMatch;
    appointment = {
      client_name: name.trim(),
      datetime: `${date}T${time}:00`,
      duration_minutes: defaultDuration,
    };
  }

  // Buscar [CANCELAR: id]
  const cancelMatch = response.match(/\[CANCELAR:\s*(.+?)\]/);
  if (cancelMatch) {
    cancelId = cancelMatch[1].trim();
  }

  // Limpiar tags del texto que ve el cliente
  const cleanReply = response
    .replace(/\[AGENDAR:.*?\]/g, "")
    .replace(/\[CANCELAR:.*?\]/g, "")
    .trim();

  return { cleanReply, appointment, cancelId };
}

// --- DB Helpers ---

async function getBusiness(id: string): Promise<Business | null> {
  const { data } = await supabaseAdmin
    .from("businesses")
    .select("id, business_name, business_type, schedule, appointment_duration, assistant_name")
    .eq("id", id)
    .single();
  return data;
}

async function getOrCreateConversation(businessId: string, clientPhone: string, clientName: string) {
  // Buscar conversación existente
  const { data: existing } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("business_id", businessId)
    .eq("client_phone", clientPhone)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing;

  // Crear nueva
  const { data: created } = await supabaseAdmin
    .from("conversations")
    .insert({
      business_id: businessId,
      client_phone: clientPhone,
      client_name: clientName,
      messages: [],
    })
    .select()
    .single();

  return created!;
}
