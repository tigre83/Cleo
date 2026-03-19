import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const createBotSchema = z.object({
  name: z.string().min(1),
  system_prompt: z.string().min(1),
  ai_provider: z.enum(['openai', 'anthropic']).default('openai'),
  ai_model: z.string().default('gpt-4o-mini'),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().min(1).max(4096).default(1024),
  whatsapp_phone_id: z.string().optional(),
  whatsapp_token: z.string().optional(),
  widget_enabled: z.boolean().default(true),
  widget_color: z.string().default('#6366f1'),
  widget_title: z.string().default('Chat con nosotros'),
  widget_greeting: z.string().default('¡Hola! ¿En qué puedo ayudarte?'),
});

const updateBotSchema = createBotSchema.partial();

router.use(authMiddleware);

// List bots
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .eq('client_id', req.client!.clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('List bots error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get single bot
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .eq('id', req.params.id)
      .eq('client_id', req.client!.clientId)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Bot no encontrado' });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error('Get bot error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Create bot
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const body = createBotSchema.parse(req.body);
    const id = uuid();

    const { data, error } = await supabase
      .from('bots')
      .insert({
        id,
        client_id: req.client!.clientId,
        ...body,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Create bot error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update bot
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const body = updateBotSchema.parse(req.body);

    const { data, error } = await supabase
      .from('bots')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('client_id', req.client!.clientId)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Bot no encontrado' });
      return;
    }

    res.json(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Update bot error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Delete bot
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { error } = await supabase
      .from('bots')
      .delete()
      .eq('id', req.params.id)
      .eq('client_id', req.client!.clientId);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error('Delete bot error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
