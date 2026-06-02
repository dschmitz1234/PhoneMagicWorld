-- ============================================================
-- MAGICAL WORLD APP — DATABASE SCHEMA
-- Run this in the Supabase SQL Editor
-- ============================================================

-- FAMILIES
CREATE TABLE families (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  magic_code    VARCHAR(6) UNIQUE NOT NULL,
  family_name   VARCHAR(100),
  phone_uk      VARCHAR(20),
  phone_de      VARCHAR(20),
  display_name  VARCHAR(100) UNIQUE,    -- friendly name/nickname for caller ID, lowercase
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- To link a phone number to a family (admin only, run in Supabase SQL editor):
-- UPDATE families SET phone_uk = '+447XXXXXXXXX', display_name = 'giggi'
--   WHERE magic_code = 'MOON42';
-- (Future: allow callers to self-register by entering magic code via DTMF keypad)

-- ROOMS
CREATE TABLE rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            VARCHAR(20) UNIQUE NOT NULL,
  display_name    VARCHAR(50) NOT NULL,
  theme_config    JSONB,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO rooms (slug, display_name) VALUES
  ('forest', 'The Forest Room'),
  ('ocean',  'The Ocean Room'),
  ('space',  'The Space Room'),
  ('castle', 'The Castle Room');

-- VOICE MESSAGES
CREATE TABLE voice_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id           UUID REFERENCES families(id),
  twilio_call_sid     VARCHAR(100),
  twilio_recording_url TEXT,
  recording_duration  INTEGER,
  transcript          TEXT,
  raw_twilio_data     JSONB,
  processed           BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ROOM EVENTS
CREATE TABLE room_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID REFERENCES families(id),
  room_id         UUID REFERENCES rooms(id),
  voice_message_id UUID REFERENCES voice_messages(id),
  intent          VARCHAR(50) NOT NULL,
  payload         JSONB NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- CREATURES
CREATE TABLE creatures (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id        UUID REFERENCES families(id),
  room_id          UUID REFERENCES rooms(id),
  room_event_id    UUID REFERENCES room_events(id),
  name             VARCHAR(100) NOT NULL,
  creature_type    VARCHAR(50) NOT NULL,
  colour_primary   VARCHAR(30),
  colour_secondary VARCHAR(30),
  personality      TEXT,
  special_ability  TEXT,
  origin_message   TEXT,
  position_x       DECIMAL(5,2) DEFAULT 50,
  position_y       DECIMAL(5,2) DEFAULT 60,
  wander_path      JSONB,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- MAGIC LETTERS
CREATE TABLE magic_letters (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id        UUID REFERENCES families(id),
  room_id          UUID REFERENCES rooms(id),
  room_event_id    UUID REFERENCES room_events(id),
  sender_name      VARCHAR(100),
  content_text     TEXT NOT NULL,
  envelope_colour  VARCHAR(30) DEFAULT 'gold',
  animation_type   VARCHAR(30) DEFAULT 'float',
  position_x       DECIMAL(5,2),
  position_y       DECIMAL(5,2),
  is_opened        BOOLEAN DEFAULT FALSE,
  opened_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- REMINDERS
CREATE TABLE reminders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id        UUID REFERENCES families(id),
  room_id          UUID REFERENCES rooms(id),
  room_event_id    UUID REFERENCES room_events(id),
  message_text     TEXT NOT NULL,
  orb_colour       VARCHAR(30) DEFAULT 'lavender',
  remind_at        TIMESTAMPTZ,
  is_completed     BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- HIDDEN OBJECTS
CREATE TABLE hidden_objects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id        UUID REFERENCES families(id),
  room_id          UUID REFERENCES rooms(id),
  room_event_id    UUID REFERENCES room_events(id),
  object_type      VARCHAR(50),
  description      TEXT,
  hint_text        TEXT,
  position_x       DECIMAL(5,2),
  position_y       DECIMAL(5,2),
  is_found         BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- CONVERSATIONS (live call state)
CREATE TABLE conversations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid       TEXT UNIQUE NOT NULL,
  family_id      UUID REFERENCES families(id),       -- null = anonymous caller
  language       VARCHAR(5) NOT NULL DEFAULT 'en',   -- 'en' | 'de'
  history        JSONB NOT NULL DEFAULT '[]',        -- last 6 turns [{role, text}]
  silence_count  INTEGER NOT NULL DEFAULT 0,
  is_complete    BOOLEAN NOT NULL DEFAULT FALSE,
  pending_action JSONB,                              -- last action_payload awaiting recording
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- VOICE MEMOS (person-to-person / person-to-room audio messages)
CREATE TABLE voice_memos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_family_id    UUID REFERENCES families(id),        -- null = anonymous caller
  recipient_family_id UUID REFERENCES families(id) NOT NULL,
  room_slug           VARCHAR(20) NOT NULL DEFAULT 'forest',
  audio_url           TEXT NOT NULL,                       -- Supabase Storage public URL
  duration_seconds    INTEGER,
  transcript          TEXT,                                -- Whisper transcription (async, nullable)
  is_listened         BOOLEAN NOT NULL DEFAULT FALSE,
  listened_at         TIMESTAMPTZ,
  position_x          DECIMAL(5,2) DEFAULT 50,
  position_y          DECIMAL(5,2) DEFAULT 65,
  call_sid            TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENABLE REALTIME
-- Run in Supabase Dashboard → Database → Replication
-- Or via SQL:
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE creatures;
-- ALTER PUBLICATION supabase_realtime ADD TABLE magic_letters;
-- ALTER PUBLICATION supabase_realtime ADD TABLE reminders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE hidden_objects;
-- ALTER PUBLICATION supabase_realtime ADD TABLE room_events;
-- ALTER PUBLICATION supabase_realtime ADD TABLE voice_memos;

-- ============================================================
-- AI PROVIDER KEYS
-- Stores encrypted API keys for each AI provider.
-- The app layer encrypts/decrypts using AES-256-GCM (ENCRYPTION_KEY env var).
-- For Azure, api_key_enc holds a JSON-encoded config object — see lib/ai.ts.
-- ============================================================
CREATE TYPE ai_provider AS ENUM ('openai', 'anthropic', 'google', 'groq', 'azure');

CREATE TABLE ai_provider_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    ai_provider NOT NULL UNIQUE,
  -- Encrypted with ENCRYPTION_KEY via AES-256-GCM (format: "iv:authTag:ciphertext")
  -- For Azure: JSON { apiKey, resourceName, deploymentName, endpointUrl?, apiVersion? }
  api_key_enc TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Only the service role (server-side) can read/write AI keys — no client access
-- (Row Level Security enabled; all access through service role only)
ALTER TABLE ai_provider_keys ENABLE ROW LEVEL SECURITY;

