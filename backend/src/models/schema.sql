-- ============================================
-- CLEO — Esquema de Base de Datos (Supabase)
-- Ejecutar en SQL Editor de Supabase
-- ============================================

-- Negocios (usa Supabase Auth para el usuario)
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT,                -- peluqueria, clinica_dental, spa, manicura, otro
  schedule JSONB DEFAULT '{
    "lunes":    {"open": "09:00", "close": "18:00", "active": true},
    "martes":   {"open": "09:00", "close": "18:00", "active": true},
    "miercoles":{"open": "09:00", "close": "18:00", "active": true},
    "jueves":   {"open": "09:00", "close": "18:00", "active": true},
    "viernes":  {"open": "09:00", "close": "18:00", "active": true},
    "sabado":   {"open": "09:00", "close": "14:00", "active": true},
    "domingo":  {"open": "00:00", "close": "00:00", "active": false}
  }',
  appointment_duration INT DEFAULT 30,  -- minutos
  assistant_name TEXT,                   -- default se genera: "Asistente de {business_name}"
  plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'basico', 'negocio', 'pro')),
  messages_used INT DEFAULT 0,
  messages_limit INT DEFAULT 500,
  trial_ends_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  grace_period_ends_at TIMESTAMP DEFAULT (NOW() + INTERVAL '37 days'),
  deleted_at TIMESTAMP,
  retention_emails_sent INT DEFAULT 0,
  cancelled_at TIMESTAMP,
  reactivated_at TIMESTAMP,
  cancellation_reason TEXT,
  paused_until TIMESTAMP,
  pause_used BOOLEAN DEFAULT false,
  pending_downgrade TEXT,
  billing_period_ends_at TIMESTAMP,
  verification_code_hash TEXT,
  verification_code_expires_at TIMESTAMP,
  email_verified BOOLEAN DEFAULT false,
  service_modality TEXT DEFAULT 'local' CHECK (service_modality IN ('local', 'mobile', 'both')),
  business_address TEXT,
  location_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conexiones WhatsApp (Embedded Signup de Meta)
CREATE TABLE whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,       -- de Meta
  waba_id TEXT NOT NULL,               -- WhatsApp Business Account ID
  access_token TEXT NOT NULL,          -- token permanente de Meta
  phone_number TEXT,                   -- número en formato +593...
  connected_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- Citas agendadas
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_name TEXT,
  client_phone TEXT,
  datetime TIMESTAMP NOT NULL,
  duration_minutes INT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_by TEXT DEFAULT 'ia' CHECK (created_by IN ('ia', 'manual')),
  service_id UUID REFERENCES services(id),
  client_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversaciones
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_phone TEXT NOT NULL,
  client_name TEXT,
  messages JSONB DEFAULT '[]',         -- [{role, content, timestamp}]
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Horarios bloqueados (el dueño bloquea días/horas y la IA no agenda ahí)
CREATE TABLE blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,                  -- fecha bloqueada
  start_time TIME,                     -- NULL = todo el día
  end_time TIME,                       -- NULL = todo el día
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_businesses_user ON businesses(user_id);
CREATE INDEX idx_whatsapp_phone_id ON whatsapp_connections(phone_number_id);
CREATE INDEX idx_appointments_business_date ON appointments(business_id, datetime);
CREATE INDEX idx_appointments_status ON appointments(business_id, status);
CREATE INDEX idx_conversations_business ON conversations(business_id);
CREATE INDEX idx_conversations_phone ON conversations(business_id, client_phone);
CREATE INDEX idx_blocked_slots_date ON blocked_slots(business_id, date);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner access" ON businesses
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Owner WA" ON whatsapp_connections
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Owner appointments" ON appointments
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Owner conversations" ON conversations
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Owner blocked_slots" ON blocked_slots
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ============================================
-- FUNCIÓN: Incrementar contador de mensajes
-- ============================================
CREATE OR REPLACE FUNCTION increment_message_count(p_business_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE businesses
  SET messages_used = messages_used + 1
  WHERE id = p_business_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- EXPENSES (Admin — egresos del negocio Cleo)
-- ============================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('infra', 'ia', 'wa', 'email', 'tools', 'other')),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  recurring BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- ============================================
-- ADMIN NOTES (internal notes per business)
-- ============================================
CREATE TABLE admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_notes_business ON admin_notes(business_id);

-- Add status and previous_plan columns to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended', 'cancelled'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS previous_plan TEXT;

-- Billing cycle and renewal fields
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMP;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS plan_renews_at TIMESTAMP;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Cancellation feedback fields
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cancellation_feedback TEXT;

-- Terms acceptance timestamp
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMP;
