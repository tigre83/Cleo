import { supabaseAdmin } from "../config/supabase";

// ============================================
// RATE LIMITING — Límites por conversación
// Max 20 msgs/24h y 10 msgs/1h por cliente
// ============================================

interface RateLimitResult {
  allowed: boolean;
  message?: string;
}

export async function checkRateLimit(businessId: string, clientPhone: string): Promise<RateLimitResult> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Contar mensajes en la última hora
  const { count: hourCount } = await supabaseAdmin
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("client_phone", clientPhone)
    .gte("created_at", oneHourAgo);

  if ((hourCount || 0) >= 10) {
    return {
      allowed: false,
      message: "Has enviado muchos mensajes. Por favor espera un momento antes de continuar.",
    };
  }

  // Contar mensajes en las últimas 24 horas
  const { count: dayCount } = await supabaseAdmin
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("client_phone", clientPhone)
    .gte("created_at", oneDayAgo);

  if ((dayCount || 0) >= 20) {
    return {
      allowed: false,
      message: "Has enviado muchos mensajes. Por favor espera un momento antes de continuar.",
    };
  }

  // Registrar este mensaje
  await supabaseAdmin.from("rate_limits").insert({
    business_id: businessId,
    client_phone: clientPhone,
  });

  return { allowed: true };
}

// Limpieza periódica — llamar desde cron diario
export async function cleanOldRateLimits() {
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin.from("rate_limits").delete().lt("created_at", twoDaysAgo);
}
