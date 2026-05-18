-- ── Aprobaciones: workflow de cambios sugeridos por IA ───────────────────────
CREATE TABLE IF NOT EXISTS aprobaciones (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id        UUID REFERENCES cuentas_vinculadas(id) ON DELETE CASCADE,
  usuario_id       UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo             TEXT NOT NULL CHECK (tipo IN ('bid','budget','pause','enable','keyword','extension','otro')),
  descripcion      TEXT NOT NULL,
  razon            TEXT,
  detalle          TEXT,
  prioridad        TEXT DEFAULT 'media' CHECK (prioridad IN ('alta','media','baja')),
  impacto_estimado TEXT,
  estado           TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado')),
  creado_en        TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aprobaciones_cuenta_estado
  ON aprobaciones(cuenta_id, estado);

-- ── QS Histórico: snapshot diario de Quality Score por keyword ────────────────
CREATE TABLE IF NOT EXISTS qs_historico (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id               UUID REFERENCES cuentas_vinculadas(id) ON DELETE CASCADE,
  keyword_text            TEXT NOT NULL,
  keyword_resource_name   TEXT,
  quality_score           INTEGER CHECK (quality_score BETWEEN 1 AND 10),
  creative_quality_score  TEXT,
  post_click_quality_score TEXT,
  search_predicted_ctr    TEXT,
  fecha                   DATE NOT NULL DEFAULT CURRENT_DATE,
  creado_en               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cuenta_id, keyword_text, fecha)
);

CREATE INDEX IF NOT EXISTS idx_qs_historico_cuenta_fecha
  ON qs_historico(cuenta_id, fecha DESC);

-- ── Configuración de integraciones por usuario (Telegram, Discord, OAuth) ──────
CREATE TABLE IF NOT EXISTS configuracion_integraciones (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id     UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo           TEXT NOT NULL CHECK (tipo IN ('telegram','discord','gsc','ga4','merchant','gmb')),
  config         JSONB DEFAULT '{}',
  activa         BOOLEAN DEFAULT TRUE,
  creado_en      TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_integraciones_usuario
  ON configuracion_integraciones(usuario_id, tipo);
