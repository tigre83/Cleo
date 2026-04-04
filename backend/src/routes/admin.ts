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

// --- POST /admin/login — validate credentials, send 2FA code ---
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
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- POST /admin/verify-2fa — verify code, return JWT ---
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
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Admin 2FA error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- All routes below require admin JWT ---

// GET /admin/users — list all businesses
router.get('/users', adminAuthMiddleware, async (_req: AdminRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, email, business_name, plan, status, trial_ends_at, messages_used, email_verified, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /admin/stats — aggregate stats (MRR, total users, churn)
router.get('/stats', adminAuthMiddleware, async (_req: AdminRequest, res: Response) => {
  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, plan, status, created_at');

    if (error) throw error;
    const all: Array<{ id: string; plan: string; status: string; created_at: string }> =
      businesses ?? [];

    const totalUsers = all.length;
    const activeUsers = all.filter((b) => b.status === 'active').length;
    const churned = all.filter((b) => b.status === 'churned' || b.status === 'canceled').length;
    const churnRate = totalUsers > 0 ? Math.round((churned / totalUsers) * 100) : 0;

    const planPrices: Record<string, number> = {
      free: 0,
      basic: 29,
      pro: 79,
      enterprise: 199,
    };
    const mrr = all
      .filter((b) => b.status === 'active')
      .reduce((sum: number, b) => sum + (planPrices[b.plan] ?? 0), 0);

    const planCounts: Record<string, number> = {};
    for (const b of all) {
      planCounts[b.plan] = (planCounts[b.plan] ?? 0) + 1;
    }

    res.json({ totalUsers, activeUsers, mrr, churnRate, planCounts });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /admin/users/:id — change plan or suspend
router.patch('/users/:id', adminAuthMiddleware, async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = z
      .object({
        plan: z.enum(['free', 'basic', 'pro', 'enterprise']).optional(),
        status: z.enum(['active', 'suspended', 'churned', 'canceled']).optional(),
      })
      .parse(req.body);

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
    if (!data) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Admin patch user error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
