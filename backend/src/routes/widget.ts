import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { supabase } from '../config/supabase';
import { getOrCreateConversation, processMessage } from '../services/conversation';
import { Bot } from '../types';

const router = Router();

// Get bot config for widget (public endpoint)
router.get('/config/:botId', async (req: Request, res: Response) => {
  try {
    const { data: bot } = await supabase
      .from('bots')
      .select('id, name, widget_enabled, widget_color, widget_title, widget_greeting')
      .eq('id', req.params.botId)
      .eq('widget_enabled', true)
      .single();

    if (!bot) {
      res.status(404).json({ error: 'Bot no encontrado o widget deshabilitado' });
      return;
    }

    res.json(bot);
  } catch (err) {
    console.error('Widget config error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Send message via widget (public endpoint)
router.post('/message/:botId', async (req: Request, res: Response) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Mensaje requerido' });
      return;
    }

    const { data: bot } = await supabase
      .from('bots')
      .select('*')
      .eq('id', req.params.botId)
      .eq('widget_enabled', true)
      .single();

    if (!bot) {
      res.status(404).json({ error: 'Bot no encontrado' });
      return;
    }

    const webSessionId = sessionId || uuid();
    const conversation = await getOrCreateConversation(
      bot.id,
      'web',
      webSessionId
    );

    const response = await processMessage(bot as Bot, conversation, message);

    res.json({ response, sessionId: webSessionId });
  } catch (err) {
    console.error('Widget message error:', err);
    res.status(500).json({ error: 'Error procesando mensaje' });
  }
});

export default router;
