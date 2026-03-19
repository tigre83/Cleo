import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// List conversations for a bot
router.get('/bot/:botId', async (req: AuthRequest, res: Response) => {
  try {
    // Verify bot ownership
    const { data: bot } = await supabase
      .from('bots')
      .select('id')
      .eq('id', req.params.botId)
      .eq('client_id', req.client!.clientId)
      .single();

    if (!bot) {
      res.status(404).json({ error: 'Bot no encontrado' });
      return;
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('bot_id', req.params.botId)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('List conversations error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get messages for a conversation
router.get('/:id/messages', async (req: AuthRequest, res: Response) => {
  try {
    // Verify conversation ownership through bot
    const { data: conv } = await supabase
      .from('conversations')
      .select('*, bots!inner(client_id)')
      .eq('id', req.params.id)
      .single();

    if (!conv || (conv as any).bots?.client_id !== req.client!.clientId) {
      res.status(404).json({ error: 'Conversación no encontrada' });
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('List messages error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
