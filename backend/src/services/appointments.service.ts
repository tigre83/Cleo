import { supabaseAdmin } from "../config/supabase";

// ============================================
// CLEO — Servicio de Citas
// ============================================

/**
 * Crear cita agendada por la IA
 */
export async function createAppointment(
  businessId: string,
  clientPhone: string,
  clientName: string,
  datetime: string,
  durationMinutes: number,
  createdBy: "ia" | "manual" = "ia"
) {
  // Verificar que no haya conflicto de horario
  const conflict = await checkConflict(businessId, datetime, durationMinutes);
  if (conflict) {
    return { success: false, error: "Horario ya ocupado" };
  }

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert({
      business_id: businessId,
      client_name: clientName,
      client_phone: clientPhone,
      datetime,
      duration_minutes: durationMinutes,
      status: "confirmed",
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creando cita:", error);
    return { success: false, error: error.message };
  }

  return { success: true, appointment: data };
}

/**
 * Cancelar cita
 */
export async function cancelAppointment(appointmentId: string, businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("business_id", businessId)
    .select()
    .single();

  if (error) {
    console.error("Error cancelando cita:", error);
    return { success: false, error: error.message };
  }

  return { success: true, appointment: data };
}

/**
 * Obtener citas por fecha
 */
export async function getAppointmentsByDate(businessId: string, date: string) {
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  const { data } = await supabaseAdmin
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .gte("datetime", startOfDay)
    .lte("datetime", endOfDay)
    .eq("status", "confirmed")
    .order("datetime");

  return data || [];
}

/**
 * Verificar conflicto de horario
 */
async function checkConflict(
  businessId: string,
  datetime: string,
  durationMinutes: number
): Promise<boolean> {
  const start = new Date(datetime);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  // Buscar citas confirmadas que se solapen
  const { data } = await supabaseAdmin
    .from("appointments")
    .select("datetime, duration_minutes")
    .eq("business_id", businessId)
    .eq("status", "confirmed")
    .gte("datetime", new Date(start.getTime() - 24 * 60 * 60000).toISOString())
    .lte("datetime", end.toISOString());

  if (!data || data.length === 0) return false;

  return data.some((appt) => {
    const apptStart = new Date(appt.datetime);
    const apptEnd = new Date(apptStart.getTime() + appt.duration_minutes * 60000);
    return start < apptEnd && end > apptStart;
  });
}
