-- ============================================================
-- ADSAI PRO — Schema completo de tablas de aplicación
-- Ejecutar en Supabase SQL Editor o con supabase db push
-- ============================================================

-- ── usuarios ────────────────────────────────────────────────
-- Perfil de cada usuario. Se crea/actualiza en cada login OAuth.

CREATE TABLE IF NOT EXISTS usuarios (
  id                    UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_id             TEXT         UNIQUE,
  email                 TEXT         NOT NULL,
  nombre                TEXT,
  avatar                TEXT,
  plan                  TEXT         NOT NULL DEFAULT 'basico', -- 'basico' | 'profesional' | 'agencia'
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  google_refresh_token  TEXT,
  creado_en             TIMESTAMPTZ  DEFAULT NOW(),
  actualizado_en        TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario lee su propio perfil"
  ON usuarios FOR SELECT USING (auth.uid() = id);

CREATE POLICY "usuario actualiza su propio perfil"
  ON usuarios FOR UPDATE USING (auth.uid() = id);

-- ── cuentas_vinculadas ───────────────────────────────────────
-- Cuentas de Google Ads vinculadas a cada usuario.

CREATE TABLE IF NOT EXISTS cuentas_vinculadas (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id    UUID         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  customer_id   TEXT         NOT NULL,
  nombre        TEXT         NOT NULL DEFAULT 'Mi cuenta',
  moneda        TEXT         DEFAULT 'EUR',
  zona_horaria  TEXT         DEFAULT 'Europe/Madrid',
  activa        BOOLEAN      DEFAULT TRUE,
  creado_en     TIMESTAMPTZ  DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS cuentas_unique_usuario_customer
  ON cuentas_vinculadas (usuario_id, customer_id);

CREATE INDEX IF NOT EXISTS cuentas_usuario_idx
  ON cuentas_vinculadas (usuario_id, activa);

ALTER TABLE cuentas_vinculadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario ve sus cuentas"
  ON cuentas_vinculadas FOR ALL USING (usuario_id = auth.uid());

-- ── alertas ─────────────────────────────────────────────────
-- Alertas generadas por el AlertMonitor (cron).

CREATE TABLE IF NOT EXISTS alertas (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id   UUID         REFERENCES cuentas_vinculadas(id) ON DELETE CASCADE,
  usuario_id  UUID         REFERENCES usuarios(id) ON DELETE CASCADE,
  nivel       TEXT         NOT NULL, -- 'info' | 'aviso' | 'critico'
  alertas     JSONB        NOT NULL DEFAULT '[]',
  resumen     TEXT,
  leida       BOOLEAN      DEFAULT FALSE,
  creado_en   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alertas_usuario_idx
  ON alertas (usuario_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS alertas_cuenta_idx
  ON alertas (cuenta_id, leida, creado_en DESC);

ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario ve sus alertas"
  ON alertas FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "usuario actualiza sus alertas"
  ON alertas FOR UPDATE USING (usuario_id = auth.uid());

-- ── reportes ────────────────────────────────────────────────
-- Reportes white-label generados por el Agente 6.

CREATE TABLE IF NOT EXISTS reportes (
  id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id       UUID         REFERENCES cuentas_vinculadas(id) ON DELETE SET NULL,
  usuario_id      UUID         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  periodo         TEXT,
  contenido       TEXT,        -- HTML del reporte
  creado_en       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reportes_usuario_idx
  ON reportes (usuario_id, creado_en DESC);

ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario ve sus reportes"
  ON reportes FOR ALL USING (usuario_id = auth.uid());

-- ── portal_tokens ────────────────────────────────────────────
-- Tokens de acceso público a reportes (link compartible).

CREATE TABLE IF NOT EXISTS portal_tokens (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  reporte_id  UUID         NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
  token       TEXT         NOT NULL UNIQUE,
  expira_en   TIMESTAMPTZ  NOT NULL,
  creado_en   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portal_tokens_token_idx ON portal_tokens (token);

-- Sin RLS — acceso público por token opaco (seguridad por oscuridad controlada)

-- ── perfiles_agencia ─────────────────────────────────────────
-- Config white-label por usuario (Settings → Marca personalizada).

CREATE TABLE IF NOT EXISTS perfiles_agencia (
  id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id            UUID         NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre                TEXT         NOT NULL DEFAULT 'Mi Agencia',
  logo_url              TEXT,
  color_primario        TEXT         DEFAULT '#3b82f6',
  dominio_personalizado TEXT,
  actualizado_en        TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE perfiles_agencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario gestiona su perfil agencia"
  ON perfiles_agencia FOR ALL USING (usuario_id = auth.uid());

-- ── push_subscriptions ───────────────────────────────────────
-- Suscripciones Web Push por dispositivo.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id  UUID         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  endpoint    TEXT         NOT NULL UNIQUE,
  keys        JSONB        NOT NULL,
  activa      BOOLEAN      DEFAULT TRUE,
  creado_en   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_usuario_activa_idx
  ON push_subscriptions (usuario_id, activa);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario gestiona sus push subs"
  ON push_subscriptions FOR ALL USING (usuario_id = auth.uid());

-- ── feedback ─────────────────────────────────────────────────
-- Feedback enviado desde el widget de la app.

CREATE TABLE IF NOT EXISTS feedback (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id  UUID         REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo        TEXT         NOT NULL, -- 'bug' | 'mejora' | 'pregunta' | 'otro'
  mensaje     TEXT         NOT NULL,
  nps         SMALLINT,              -- 0-10
  pagina      TEXT,
  metadata    JSONB        DEFAULT '{}',
  creado_en   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feedback_creado_idx ON feedback (creado_en DESC);

-- Sin RLS de lectura para usuarios — solo admins leen feedback

-- ── waitlist ─────────────────────────────────────────────────
-- Lista de espera de la landing.

CREATE TABLE IF NOT EXISTS waitlist (
  id        UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  email     TEXT         NOT NULL UNIQUE,
  nombre    TEXT,
  tipo      TEXT         DEFAULT 'otro', -- 'autonomo' | 'empresa' | 'agencia' | 'otro'
  fuente    TEXT         DEFAULT 'organico',
  ip        TEXT,
  creado_en TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS waitlist_creado_idx ON waitlist (creado_en DESC);

-- ── logs_ia ──────────────────────────────────────────────────
-- Log de cada llamada a los agentes IA (auditoría, debug).

CREATE TABLE IF NOT EXISTS logs_ia (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id  UUID         REFERENCES usuarios(id) ON DELETE SET NULL,
  cuenta_id   UUID         REFERENCES cuentas_vinculadas(id) ON DELETE SET NULL,
  agente      TEXT         NOT NULL,
  input       JSONB,
  output      JSONB,
  creado_en   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS logs_ia_usuario_idx
  ON logs_ia (usuario_id, creado_en DESC);

-- Retención automática: borrar logs de más de 90 días
-- (añadir como pg_cron job en Supabase: SELECT cron.schedule('cleanup-logs', '0 3 * * *', 'DELETE FROM logs_ia WHERE creado_en < NOW() - INTERVAL ''90 days'''))

ALTER TABLE logs_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario ve sus logs ia"
  ON logs_ia FOR SELECT USING (usuario_id = auth.uid());
