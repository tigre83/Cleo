-- ============================================
-- RATE LIMITS (improvement #4)
-- ============================================
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_phone TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_rate_limits_lookup ON rate_limits(business_id, client_phone, created_at);

-- ============================================
-- REFERRALS (improvement #10)
-- ============================================
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES businesses(id);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS bonus_months INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES businesses(id),
  referred_id UUID REFERENCES businesses(id),
  status TEXT DEFAULT 'pending',
  bonus_applied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CHANGELOG (improvement #11)
-- ============================================
CREATE TABLE changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('nuevo', 'mejora', 'correccion')),
  published_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS last_changelog_seen_at TIMESTAMP;

-- ============================================
-- SYSTEM STATUS (improvement #9)
-- ============================================
CREATE TABLE system_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  status TEXT DEFAULT 'operational',
  description TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- ============================================
-- AUDIT LOG (admin security)
-- ============================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details JSONB,
  admin_email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
