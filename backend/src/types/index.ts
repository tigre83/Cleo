export interface Client {
  id: string;
  email: string;
  company_name: string;
  password_hash: string;
  stripe_customer_id: string | null;
  subscription_plan: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
  created_at: string;
  updated_at: string;
}

export interface Bot {
  id: string;
  client_id: string;
  name: string;
  system_prompt: string;
  ai_provider: 'openai' | 'anthropic';
  ai_model: string;
  temperature: number;
  max_tokens: number;
  whatsapp_phone_id: string | null;
  whatsapp_token: string | null;
  widget_enabled: boolean;
  widget_color: string;
  widget_title: string;
  widget_greeting: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  bot_id: string;
  channel: 'whatsapp' | 'web';
  external_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface AuthPayload {
  clientId: string;
  email: string;
}
