import { Router, Request, Response } from 'express';
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

export default router;
