import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { env } from '../config/env';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendVerificationEmail } from '../services/email';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  company_name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

function generateVerificationCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 6);
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, company_name } = registerSchema.parse(req.body);

    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      res.status(409).json({ error: 'El email ya está registrado' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const id = uuid();

    const { error: insertError } = await supabase.from('clients').insert({
      id,
      email,
      password_hash,
      company_name,
      subscription_plan: 'free',
      email_verified: false,
    });

    if (insertError) throw insertError;

    const verificationCode = generateVerificationCode();
    const codeHash = crypto
      .createHash('sha256')
      .update(verificationCode)
      .digest('hex');
    
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const { error: codeError } = await supabase
      .from('email_verification_codes')
      .insert({
        email,
        code_hash: codeHash,
        expires_at: expiresAt.toISOString(),
      });

    if (codeError) throw codeError;

    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({
      message: 'Usuario registrado. Verifica tu email.',
      email,
      requiresVerification: true,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, code } = verifyEmailSchema.parse(req.body);

    const codeHash = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    const { data: verification } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code_hash', codeHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!verification) {
      res.status(401).json({ error: 'Código inválido o expirado' });
      return;
    }

    const { error: updateError } = await supabase
      .from('clients')
      .update({ email_verified: true })
      .eq('email', email);

    if (updateError) throw updateError;

    await supabase
      .from('email_verification_codes')
      .delete()
      .eq('email', email);

    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .single();

    if (!client) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    const token = jwt.sign(
      { clientId: client.id, email: client.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '¡Email verificado exitosamente!',
      token,
      client: {
        id: client.id,
        email: client.email,
        company_name: client.company_name,
        subscription_plan: client.subscription_plan,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/resend-code', async (req: Request, res: Response) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .eq('email_verified', false)
      .single();

    if (!client) {
      res.status(404).json({ error: 'Usuario no encontrado o ya verificado' });
      return;
    }

    const verificationCode = generateVerificationCode();
    const codeHash = crypto
      .createHash('sha256')
      .update(verificationCode)
      .digest('hex');
    
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await supabase
      .from('email_verification_codes')
      .delete()
      .eq('email', email);

    const { error: codeError } = await supabase
      .from('email_verification_codes')
      .insert({
        email,
        code_hash: codeHash,
        expires_at: expiresAt.toISOString(),
      });

    if (codeError) throw codeError;

    await sendVerificationEmail(email, verificationCode);

    res.json({ message: 'Código reenviado a tu email' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Resend code error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .single();

    if (!client) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    if (!client.email_verified) {
      res.status(403).json({ 
        error: 'Email no verificado',
        requiresVerification: true,
        email: client.email,
      });
      return;
    }

    const valid = await bcrypt.compare(password, client.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const token = jwt.sign(
      { clientId: client.id, email: client.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      client: {
        id: client.id,
        email: client.email,
        company_name: client.company_name,
        subscription_plan: client.subscription_plan,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { data: client } = await supabase
      .from('clients')
      .select('id, email, company_name, subscription_plan, subscription_status, created_at')
      .eq('id', req.client!.clientId)
      .single();

    if (!client) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    res.json(client);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
