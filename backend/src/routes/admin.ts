import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { env } from '../config/env';
import { supabase } from '../config/supabase';
import { adminAuthMiddleware, AdminRequest } from '../middleware/adminAuth';
import { Resend } from 'resend';

const router = Router();
const resend = new Resend(env.RESEND_API_KEY);

// In-memory store for 2FA codes (short-lived, single admin)
let pending2FA: { codeHash: string; expiresAt: number } | null = null;

// ── POST /admin/login ─────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = z
      .object({ email: z.string().email(), password: z.string() })
      .parse(req.body);

    if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const code = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 6);
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    pending2FA = { codeHash, expiresAt: Date.now() + 10 * 60 * 1000 };

    await resend.emails.send({
      from: 'Cleo <soporte@cleoia.app>',
      to: env.ADMIN_EMAIL,
      subject: 'Código de acceso admin — Cleo',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080808;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td style="text-align:center;padding-bottom:24px;">
          <span style="font-size:28px;font-weight:800;color:#4ADE80;">Cleo</span>
          <span style="font-size:14px;color:#555;margin-left:8px;">Admin</span>
        </td></tr>
        <tr><td style="background:#0D0D0D;border:1px solid #1A1A1A;border-radius:16px;padding:32px;">
          <h1 style="margin:0 0 8px;font-size:20px;color:#FFF;">Código de acceso</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#888;">Expira en 10 minutos.</p>
          <div style="text-align:center;background:#111;border:1px solid #222;border-radius:10px;padding:16px;font-size:32px;font-weight:700;letter-spacing:10px;color:#22D3EE;font-family:'Courier New',monospace;">
            ${code}
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    res.json({ message: 'Código 2FA enviado a tu email' });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /admin/verify-2fa ────────────────────────────────────────────────────
router.post('/verify-2fa', async (req: Request, res: Response) => {
  try {
    const { code } = z.object({ code: z.string().length(6) }).parse(req.body);

    if (!pending2FA || Date.now() > pending2FA.expiresAt) {
      pending2FA = null;
      res.status(401).json({ error: 'Código expirado. Inicia sesión de nuevo.' });
      return;
    }

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    if (codeHash !== pending2FA.codeHash) {
      res.status(401).json({ error: 'Código inválido' });
      return;
    }

    pending2FA = null;
    const token = jwt.sign(
      { role: 'admin' as const, email: env.ADMIN_EMAIL },
      env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    console.error('Admin 2FA error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /admin/users ──────────────────────────────────────────────────────────
router.get('/users', adminAuthMiddleware, async (_req: AdminRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, email, business_name, business_type, plan, status, billing_cycle, plan_renews_at, messages_used, messages_limit, email_verified, created_at, cancelled_at, cancel_at_period_end, paused_until')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /admin/stats ──────────────────────────────────────────────────────────
router.get('/stats', adminAuthMiddleware, async (_req: AdminRequest, res: Response) => {
  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, plan, status, billing_cycle, created_at');
    if (error) throw error;

    const all: Array<{ id: string; plan: string; status: string; billing_cycle: string; created_at: string }> = businesses ?? [];

    const totalUsers   = all.length;
    const activeUsers  = all.filter(b => b.status === 'active').length;
    const trialUsers   = all.filter(b => b.plan === 'trial').length;
    const churned      = all.filter(b => ['churned','canceled','cancelled'].includes(b.status)).length;
    const churnRate    = totalUsers > 0 ? Math.round((churned / totalUsers) * 100) : 0;

    // Precios reales de Cleo
    const monthlyPrices: Record<string, number> = { basico: 29, negocio: 59, pro: 99 };
    const annualPrices:  Record<string, number> = { basico: 290, negocio: 590, pro: 990 };

    const mrr = all
      .filter(b => b.status === 'active')
      .reduce((sum, b) => {
        if (b.billing_cycle === 'annual') {
          return sum + Math.round((annualPrices[b.plan] ?? 0) / 12);
        }
        return sum + (monthlyPrices[b.plan] ?? 0);
      }, 0);

    // Nuevos esta semana
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newThisWeek = all.filter(b => new Date(b.created_at) > weekAgo).length;

    // Conteo por plan
    const planCounts: Record<string, number> = {};
    for (const b of all) {
      planCounts[b.plan] = (planCounts[b.plan] ?? 0) + 1;
    }

    // Crecimiento mensual — últimos 6 meses
    const MONTH_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const growth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const yr = d.getFullYear();
      const mo = d.getMonth();
      const count = all.filter(b => {
        const c = new Date(b.created_at);
        return c.getFullYear() === yr && c.getMonth() === mo;
      }).length;
      growth.push({ m: MONTH_SHORT[mo], u: count });
    }

    res.json({ totalUsers, activeUsers, trialUsers, mrr, churnRate, planCounts, newThisWeek, growth });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── PATCH /admin/users/:id ────────────────────────────────────────────────────
router.patch('/users/:id', adminAuthMiddleware, async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = z.object({
      plan:   z.enum(['trial','basico','negocio','pro']).optional(),
      status: z.enum(['active','suspended','churned','canceled']).optional(),
    }).parse(req.body);

    if (!updates.plan && !updates.status) {
      res.status(400).json({ error: 'Nada que actualizar' });
      return;
    }

    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    res.json(data);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    console.error('Admin patch user error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /admin/expenses ───────────────────────────────────────────────────────
router.get('/expenses', adminAuthMiddleware, async (_req: AdminRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    console.error('Admin expenses error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /admin/expenses ──────────────────────────────────────────────────────
router.post('/expenses', adminAuthMiddleware, async (req: AdminRequest, res: Response) => {
  try {
    const body = z.object({
      category:    z.string(),
      description: z.string(),
      amount:      z.number().min(0),
      date:        z.string(),
      recurring:   z.boolean().optional().default(false),
      notes:       z.string().optional().default(''),
    }).parse(req.body);

    const { data, error } = await supabase.from('expenses').insert(body).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    console.error('Admin create expense error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── DELETE /admin/expenses/:id ────────────────────────────────────────────────
router.delete('/expenses/:id', adminAuthMiddleware, async (req: AdminRequest, res: Response) => {
  try {
    const { error } = await supabase.from('expenses').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete expense error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /admin/system-status ──────────────────────────────────────────────────
router.get('/system-status', adminAuthMiddleware, async (_req: AdminRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('system_status')
      .select('*')
      .order('started_at', { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    console.error('Admin system-status error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /admin/system-status ─────────────────────────────────────────────────
router.post('/system-status', adminAuthMiddleware, async (req: AdminRequest, res: Response) => {
  try {
    const body = z.object({
      service:     z.string(),
      status:      z.enum(['operational','degraded','outage']),
      description: z.string().optional().default(''),
    }).parse(req.body);

    const { data, error } = await supabase
      .from('system_status')
      .insert({ ...body, started_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    console.error('Admin create status error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── PATCH /admin/system-status/:id/resolve ────────────────────────────────────
router.patch('/system-status/:id/resolve', adminAuthMiddleware, async (req: AdminRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('system_status')
      .update({ status: 'operational', resolved_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Admin resolve status error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── DELETE /admin/system-status/:id ──────────────────────────────────────────
router.delete('/system-status/:id', adminAuthMiddleware, async (req: AdminRequest, res: Response) => {
  try {
    const { error } = await supabase.from('system_status').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete status error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// ── GET /admin/health-check — verifica servicios en tiempo real ───────────────
router.get('/health-check', adminAuthMiddleware, async (_req: AdminRequest, res: Response) => {
  const results: Array<{ service: string; ok: boolean; latency: number; detail: string }> = [];

  const check = async (name: string, fn: () => Promise<string>) => {
    const start = Date.now();
    try {
      const detail = await fn();
      results.push({ service: name, ok: true, latency: Date.now() - start, detail });
    } catch (err: any) {
      results.push({ service: name, ok: false, latency: Date.now() - start, detail: err?.message || 'Error desconocido' });
    }
  };

  await Promise.all([
    // Supabase
    check('Supabase', async () => {
      const { error } = await supabase.from('businesses').select('id').limit(1);
      if (error) throw new Error(error.message);
      return 'Conexión OK';
    }),

    // Backend / Railway — siempre OK si estamos respondiendo
    check('Railway (API)', async () => 'Servidor activo'),

    // Resend
    check('Resend', async () => {
      if (!env.RESEND_API_KEY) throw new Error('API key no configurada');
      const r = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
      });
      if (!r.ok && r.status !== 200) throw new Error(`HTTP ${r.status}`);
      return 'API key válida';
    }),

    // Meta WhatsApp
    check('WhatsApp Meta', async () => {
      const token   = env.WHATSAPP_ACCESS_TOKEN;
      const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
      if (!token || token === 'pendiente') throw new Error('Token no configurado');
      const r = await fetch(`https://graph.facebook.com/v18.0/${phoneId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return 'Token válido';
    }),

    // Claude API (Anthropic)
    check('Claude API', async () => {
      const key = env.ANTHROPIC_API_KEY;
      if (!key) throw new Error('API key no configurada');
      return 'Key configurada';
    }),
  ]);

  res.json(results);
});


// ── GET /admin/team — listar miembros del equipo ──────────────────────────────
router.get('/team', adminAuthMiddleware, async (req: AdminRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, role, active, created_at, last_login_at, invited_by')
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    console.error('Admin team error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /admin/invite — enviar invitación ────────────────────────────────────
router.post('/invite', adminAuthMiddleware, async (req: AdminRequest, res: Response) => {
  try {
    const { email, role } = z.object({
      email: z.string().email(),
      role:  z.enum(['owner', 'soporte']),
    }).parse(req.body);

    // Generar token único
    const token      = crypto.randomBytes(32).toString('hex');
    const expiresAt  = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Upsert en admin_users
    const { error } = await supabase
      .from('admin_users')
      .upsert({
        email,
        role,
        invite_token:      token,
        invite_expires_at: expiresAt,
        invited_by:        env.ADMIN_EMAIL,
        active:            false,
      }, { onConflict: 'email' });
    if (error) throw error;

    // Enviar email de invitación
    const inviteUrl = `${env.FRONTEND_URL}/admin/invite/${token}`;
    const rolLabel  = role === 'owner' ? 'Dueño' : 'Soporte';

    await resend.emails.send({
      from: 'Cleo <noreply@cleoia.app>',
      to:   email,
      subject: 'Te invitaron al panel de administración — Cleo',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080808;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td style="text-align:center;padding-bottom:24px;">
          <span style="font-size:28px;font-weight:800;color:#4ADE80;">Cleo</span>
          <span style="font-size:14px;color:#555;margin-left:8px;">Admin</span>
        </td></tr>
        <tr><td style="background:#0D0D0D;border:1px solid #1A1A1A;border-radius:16px;padding:32px;">
          <h1 style="margin:0 0 8px;font-size:20px;color:#FFF;">Fuiste invitado al panel admin</h1>
          <p style="margin:0 0 8px;font-size:14px;color:#888;">Rol asignado: <strong style="color:#4ADE80;">${rolLabel}</strong></p>
          <p style="margin:0 0 24px;font-size:14px;color:#888;">Este link expira en 24 horas.</p>
          <a href="${inviteUrl}" style="display:block;text-align:center;background:#4ADE80;color:#080808;padding:14px 24px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">Aceptar invitación</a>
          <p style="margin:16px 0 0;font-size:11px;color:#444;text-align:center;">Si no esperabas esta invitación, ignora este email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    res.json({ ok: true, expires_at: expiresAt });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    console.error('Admin invite error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /admin/invite/:token — validar token de invitación ────────────────────
router.get('/invite/:token', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('email, role, invite_expires_at')
      .eq('invite_token', req.params.token)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Invitación no encontrada o ya usada' });
      return;
    }
    if (new Date(data.invite_expires_at) < new Date()) {
      res.status(410).json({ error: 'La invitación expiró' });
      return;
    }
    res.json({ email: data.email, role: data.role });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /admin/invite/:token/accept — crear contraseña y activar cuenta ──────
router.post('/invite/:token/accept', async (req: Request, res: Response) => {
  try {
    const { password } = z.object({ password: z.string().min(8) }).parse(req.body);

    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, role, invite_expires_at')
      .eq('invite_token', req.params.token)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Invitación no encontrada' });
      return;
    }
    if (new Date(data.invite_expires_at) < new Date()) {
      res.status(410).json({ error: 'La invitación expiró' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await supabase
      .from('admin_users')
      .update({
        password_hash:     passwordHash,
        invite_token:      null,
        invite_expires_at: null,
        active:            true,
      })
      .eq('id', data.id);

    // Emitir JWT igual que el login normal
    const token = jwt.sign(
      { role: data.role, email: data.email, adminId: data.id },
      env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, role: data.role, email: data.email });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /admin/login/member — login para miembros invitados ──────────────────
router.post('/login/member', async (req: Request, res: Response) => {
  try {
    const { email, password } = z.object({
      email:    z.string().email(),
      password: z.string(),
    }).parse(req.body);

    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, role, password_hash, active')
      .eq('email', email)
      .single();

    if (error || !data || !data.active || !data.password_hash) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const valid = await bcrypt.compare(password, data.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    await supabase.from('admin_users').update({ last_login_at: new Date().toISOString() }).eq('id', data.id);

    const token = jwt.sign(
      { role: data.role, email: data.email, adminId: data.id },
      env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, role: data.role, email: data.email });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── PATCH /admin/team/:id — cambiar rol o desactivar ─────────────────────────
router.patch('/team/:id', adminAuthMiddleware, async (req: AdminRequest, res: Response) => {
  try {
    const updates = z.object({
      role:   z.enum(['owner','soporte']).optional(),
      active: z.boolean().optional(),
    }).parse(req.body);

    const { data, error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── DELETE /admin/team/:id — revocar acceso ───────────────────────────────────
router.delete('/team/:id', adminAuthMiddleware, async (req: AdminRequest, res: Response) => {
  try {
    const { error } = await supabase.from('admin_users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// ── POST /admin/change-password — cambiar contraseña desde adentro ────────────
router.post('/change-password', adminAuthMiddleware, async (req: AdminRequest, res: Response) => {
  try {
    const { current_password, new_password } = z.object({
      current_password: z.string(),
      new_password:     z.string().min(8),
    }).parse(req.body);

    // Obtener email del JWT
    const authHeader = (req as any).headers?.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, env.JWT_SECRET) as { email: string; role: string };
    const adminEmail = decoded.email;

    // Si es el dueño principal (usa env credentials)
    if (adminEmail === env.ADMIN_EMAIL) {
      if (current_password !== env.ADMIN_PASSWORD) {
        res.status(401).json({ error: 'Contraseña actual incorrecta' });
        return;
      }
      // El dueño debe cambiarla en Railway — no podemos cambiar env vars en runtime
      res.status(400).json({ error: 'El administrador principal debe cambiar la contraseña en Railway' });
      return;
    }

    // Miembro invitado — verificar con bcrypt
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, password_hash')
      .eq('email', adminEmail)
      .single();

    if (error || !data) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

    const valid = await bcrypt.compare(current_password, data.password_hash || '');
    if (!valid) { res.status(401).json({ error: 'Contraseña actual incorrecta' }); return; }

    const newHash = await bcrypt.hash(new_password, 12);
    await supabase.from('admin_users').update({ password_hash: newHash }).eq('id', data.id);

    res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── POST /admin/forgot-password — enviar código de recuperación ───────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    // Generar código
    const code     = crypto.randomBytes(3).toString('hex').toUpperCase();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Buscar en admin_users (miembros invitados)
    const { data } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', email)
      .eq('active', true)
      .single();

    // También aceptar el email del dueño principal
    const isOwner = email === env.ADMIN_EMAIL;

    if (!data && !isOwner) {
      // No revelar si el email existe
      res.json({ ok: true });
      return;
    }

    if (data) {
      await supabase.from('admin_users').update({
        invite_token:      codeHash, // reutilizamos invite_token para el código
        invite_expires_at: expiresAt,
      }).eq('id', data.id);
    }

    // Enviar email
    await resend.emails.send({
      from:    'Cleo <noreply@cleoia.app>',
      to:      email,
      subject: `${code} — Código para recuperar tu contraseña`,
      html: `
<body style="background:#080808;font-family:sans-serif;padding:40px 20px;text-align:center;">
  <div style="max-width:400px;margin:0 auto;background:#111;border:1px solid #1E1E1E;border-radius:16px;padding:32px;">
    <div style="font-size:24px;font-weight:800;color:#4ADE80;margin-bottom:8px;">cleo.</div>
    <h2 style="color:#fff;margin:0 0 8px;">Recuperar contraseña</h2>
    <p style="color:#888;font-size:14px;margin:0 0 24px;">Tu código expira en 15 minutos.</p>
    <div style="background:#080808;border:1px solid #222;border-radius:10px;padding:16px;font-size:28px;font-weight:700;letter-spacing:8px;color:#22D3EE;font-family:monospace;">${code}</div>
    <p style="color:#444;font-size:11px;margin-top:16px;">Si no solicitaste esto, ignora este email.</p>
  </div>
</body>`,
    });

    res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── POST /admin/reset-password — aplicar nueva contraseña con código ──────────
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, new_password } = z.object({
      email:        z.string().email(),
      code:         z.string().length(6),
      new_password: z.string().min(8),
    }).parse(req.body);

    const codeHash = crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');

    const { data, error } = await supabase
      .from('admin_users')
      .select('id, invite_token, invite_expires_at')
      .eq('email', email)
      .single();

    if (error || !data) { res.status(404).json({ error: 'Código inválido' }); return; }
    if (data.invite_token !== codeHash) { res.status(401).json({ error: 'Código inválido' }); return; }
    if (new Date(data.invite_expires_at) < new Date()) { res.status(410).json({ error: 'Código expirado' }); return; }

    const newHash = await bcrypt.hash(new_password, 12);
    await supabase.from('admin_users').update({
      password_hash:     newHash,
      invite_token:      null,
      invite_expires_at: null,
    }).eq('id', data.id);

    res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
