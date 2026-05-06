-- ADSAI PRO — Schema inicial de Supabase
-- Ejecutar en el SQL Editor de Supabase

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT,
  avatar TEXT,
  plan TEXT DEFAULT 'basico' CHECK (plan IN ('basico', 'profesional', 'agencia')),
  google_refresh_token TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Cuentas Google Ads vinculadas
CREATE TABLE IF NOT EXISTS cuentas_vinculadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  nombre TEXT,
  moneda TEXT DEFAULT 'EUR',
  zona_horaria TEXT DEFAULT 'Europe/Madrid',
  activa BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, customer_id)
);

-- Caché de campañas (evitar llamadas repetidas a Google Ads API)
CREATE TABLE IF NOT EXISTS campanas_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cuenta_id UUID NOT NULL REFERENCES cuentas_vinculadas(id) ON DELETE CASCADE,
  datos JSONB NOT NULL,
  periodo TEXT NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Logs de agentes IA
CREATE TABLE IF NOT EXISTS logs_ia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cuenta_id UUID REFERENCES cuentas_vinculadas(id) ON DELETE SET NULL,
  agente TEXT NOT NULL,
  input TEXT,
  output TEXT,
  tokens_usados INTEGER,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Reportes generados
CREATE TABLE IF NOT EXISTS reportes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cuenta_id UUID NOT NULL REFERENCES cuentas_vinculadas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT DEFAULT 'semanal' CHECK (tipo IN ('semanal', 'mensual', 'personalizado')),
  contenido JSONB,
  url_pdf TEXT,
  enviado_email BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_cuentas_usuario ON cuentas_vinculadas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_ia(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_creado ON logs_ia(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_reportes_cuenta ON reportes(cuenta_id);

-- Row Level Security
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_vinculadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;

-- Políticas: cada usuario solo ve sus propios datos
CREATE POLICY "usuarios_propios" ON usuarios FOR ALL USING (auth.uid()::text = google_id);
CREATE POLICY "cuentas_propias" ON cuentas_vinculadas FOR ALL USING (
  usuario_id IN (SELECT id FROM usuarios WHERE google_id = auth.uid()::text)
);
CREATE POLICY "logs_propios" ON logs_ia FOR ALL USING (
  usuario_id IN (SELECT id FROM usuarios WHERE google_id = auth.uid()::text)
);
CREATE POLICY "reportes_propios" ON reportes FOR ALL USING (
  usuario_id IN (SELECT id FROM usuarios WHERE google_id = auth.uid()::text)
);
