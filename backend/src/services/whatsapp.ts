import axios from 'axios';
import { env } from '../config/env';
import { supabase } from '../config/supabase';
import { getOrCreateConversation, processMessage } from './conversation';
import { Bot } from '../types';

export async function handleWhatsAppWebhook(body: any): Promise<void> {
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  if (!value?.messages?.[0]) return;

  const message = value.messages[0];
  const phoneNumberId = value.metadata?.phone_number_id;
  const from = message.from;
  const text = message.text?.body;

  if (!text || !phoneNumberId) return;

  // Find the bot associated with this WhatsApp phone number
  const { data: bot } = await supabase
    .from('bots')
    .select('*')
    .eq('whatsapp_phone_id', phoneNumberId)
    .single();

  if (!bot) return;

  const contactName = value.contacts?.[0]?.profile?.name || from;
  const conversation = await getOrCreateConversation(
    bot.id,
    'whatsapp',
    from,
    contactName,
    from
  );

  const response = await processMessage(bot as Bot, conversation, text);

  await sendWhatsAppMessage(bot.whatsapp_token!, phoneNumberId, from, response);
}

async function sendWhatsAppMessage(
  token: string,
  phoneNumberId: string,
  to: string,
  text: string
): Promise<void> {
  await axios.post(
    `${env.WHATSAPP_API_URL}/${env.WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

export function verifyWhatsAppWebhook(query: {
  'hub.mode'?: string;
  'hub.verify_token'?: string;
  'hub.challenge'?: string;
}): string | null {
  if (
    query['hub.mode'] === 'subscribe' &&
    query['hub.verify_token'] === env.WHATSAPP_VERIFY_TOKEN
  ) {
    return query['hub.challenge'] || null;
  }
  return null;
}
