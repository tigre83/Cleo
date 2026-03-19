import OpenAI from 'openai';
import Anthropic from 'anthropic';
import { env } from '../config/env';
import { Bot, Message } from '../types';

let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');
    openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return openai;
}

function getAnthropic(): Anthropic {
  if (!anthropic) {
    if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');
    anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

export async function generateResponse(
  bot: Bot,
  history: Message[],
  userMessage: string
): Promise<string> {
  const messages = history.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
  messages.push({ role: 'user', content: userMessage });

  if (bot.ai_provider === 'anthropic') {
    return generateAnthropicResponse(bot, messages);
  }
  return generateOpenAIResponse(bot, messages);
}

async function generateOpenAIResponse(
  bot: Bot,
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const client = getOpenAI();
  const response = await client.chat.completions.create({
    model: bot.ai_model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: bot.system_prompt },
      ...messages,
    ],
    temperature: bot.temperature,
    max_tokens: bot.max_tokens,
  });
  return response.choices[0]?.message?.content || 'No pude generar una respuesta.';
}

async function generateAnthropicResponse(
  bot: Bot,
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const client = getAnthropic();
  const response = await client.messages.create({
    model: bot.ai_model || 'claude-haiku-4-5-20251001',
    system: bot.system_prompt,
    messages,
    temperature: bot.temperature,
    max_tokens: bot.max_tokens,
  });
  const block = response.content[0];
  return block.type === 'text' ? block.text : 'No pude generar una respuesta.';
}
