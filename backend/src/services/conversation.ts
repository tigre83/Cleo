import { v4 as uuid } from 'uuid';
import { supabase } from '../config/supabase';
import { generateResponse } from './ai';
import { Bot, Conversation, Message } from '../types';

export async function getOrCreateConversation(
  botId: string,
  channel: 'whatsapp' | 'web',
  externalId: string | null,
  contactName?: string,
  contactPhone?: string
): Promise<Conversation> {
  if (externalId) {
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('bot_id', botId)
      .eq('channel', channel)
      .eq('external_id', externalId)
      .eq('status', 'active')
      .single();

    if (existing) return existing as Conversation;
  }

  const conv: Partial<Conversation> = {
    id: uuid(),
    bot_id: botId,
    channel,
    external_id: externalId,
    contact_name: contactName || null,
    contact_phone: contactPhone || null,
    status: 'active',
  };

  const { data, error } = await supabase
    .from('conversations')
    .insert(conv)
    .select()
    .single();

  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return data as Conversation;
}

export async function processMessage(
  bot: Bot,
  conversation: Conversation,
  userText: string
): Promise<string> {
  // Save user message
  await supabase.from('messages').insert({
    id: uuid(),
    conversation_id: conversation.id,
    role: 'user',
    content: userText,
  });

  // Get recent history (last 20 messages for context)
  const { data: history } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })
    .limit(20);

  const aiResponse = await generateResponse(
    bot,
    (history || []) as Message[],
    userText
  );

  // Save assistant message
  await supabase.from('messages').insert({
    id: uuid(),
    conversation_id: conversation.id,
    role: 'assistant',
    content: aiResponse,
  });

  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversation.id);

  return aiResponse;
}
