import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";
import { supabaseAdmin } from "../config/supabase";

/**
 * Middleware de autenticación con Supabase Auth
 * Extrae el user_id del token JWT de Supabase
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = authHeader.split(" ")[1];

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }

  (req as any).userId = data.user.id;
  (req as any).userEmail = data.user.email;
  next();
}

/**
 * Middleware que verifica si el plan está activo.
 * Si el trial venció y no hay plan pago → 403.
 * DEBE ir después de requireAuth.
 */
export async function requireActivePlan(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId;

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("plan, trial_ends_at, grace_period_ends_at, deleted_at")
    .eq("user_id", userId)
    .single();

  if (!business) {
    return res.status(404).json({ error: "Negocio no encontrado" });
  }

  // Cuenta eliminada (soft delete)
  if (business.deleted_at) {
    return res.status(410).json({ error: "account_deleted", message: "Esta cuenta fue eliminada." });
  }

  // Planes pagos siempre tienen acceso
  if (business.plan !== "trial") {
    return next();
  }

  // Trial activo
  if (new Date(business.trial_ends_at) > new Date()) {
    return next();
  }

  // Grace period vencido → cuenta será eliminada
  if (business.grace_period_ends_at && new Date(business.grace_period_ends_at) < new Date()) {
    return res.status(410).json({
      error: "grace_expired",
      message: "Tu período de gracia terminó. Tu cuenta será eliminada.",
    });
  }

  // Trial vencido, en período de gracia → paywall
  return res.status(403).json({
    error: "trial_expired",
    message: "Tu prueba gratuita ha terminado. Elige un plan para continuar.",
  });
}
