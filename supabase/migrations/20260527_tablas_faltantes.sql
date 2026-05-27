-- ============================================================
-- ADSAI PRO — Tablas faltantes (C-01)
-- 5 tablas requeridas por el código pero ausentes en el schema
-- Ejecutar en Supabase SQL Editor DESPUÉS de 20260518_schema_completo.sql
-- ============================================================


-- ── job_results ──────────────────────────────────────────────
-- Resultados de jobs BullMQ encolados (agentes IA).
-- Leído por GET /api/ai/job/:jobId para hacer polling desde el frontend.

CREATE TABLE IF NOT EXISTS job_results (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id      TEXT        NOT NULL UNIQUE,
  usuario_id  UUID        REFERENCES usuarios(id) ON DELETE CASCADE,
  resultado   JSONB,
  estado      TEXT        NOT NULL DEFAULT 'pendiente', -- 'pendiente' | 'completado' | 'fallido'
  creado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS job_results_usuario_idx
  ON job_results (usuario_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS job_results_job_id_idx
  ON job_results (job_id);

ALTER TABLE job_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario ve sus job_results"
  ON job_results FOR SELECT USING (usuario_id = auth.uid());


-- ── sync_log ─────────────────────────────────────────────────
-- Registro de sincronizaciones con Google Ads y QS snapshots.
-- Escrito por syncWorker, útil para auditoría y diagnóstico.

CREATE TABLE IF NOT EXISTS sync_log (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id   UUID        REFERENCES cuentas_vinculadas(id) ON DELETE CASCADE,
  tipo        TEXT        NOT NULL,  -- 'google_ads' | 'qs_snapshot'
  estado      TEXT        NOT NULL,  -- 'completado' | 'fallido'
  detalle     JSONB,
  creado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sync_log_cuenta_idx
  ON sync_log (cuenta_id, creado_en DESC);

ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario ve sus sync_log"
  ON sync_log FOR SELECT
  USING (
    cuenta_id IN (
      SELECT id FROM cuentas_vinculadas WHERE usuario_id = auth.uid()
    )
  );


-- ── aprobaciones ─────────────────────────────────────────────
-- Cambios sugeridos por la IA pendientes de aprobación humana.
-- Gestionado por GET|POST /api/optimizer/pendientes|aprobar|rechazar.

CREATE TABLE IF NOT EXISTS aprobaciones (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id        UUID        NOT NULL REFERENCES cuentas_vinculadas(id) ON DELETE CASCADE,
  usuario_id       UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo             TEXT,
  descripcion      TEXT        NOT NULL,
  razon            TEXT,
  detalle          TEXT,
  prioridad        TEXT        DEFAULT 'media',     -- 'alta' | 'media' | 'baja'
  impacto_estimado TEXT,
  estado           TEXT        NOT NULL DEFAULT 'pendiente', -- 'pendiente' | 'aprobado' | 'rechazado'
  creado_en        TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS aprobaciones_cuenta_estado_idx
  ON aprobaciones (cuenta_id, estado, creado_en DESC);

ALTER TABLE aprobaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario ve sus aprobaciones"
  ON aprobaciones FOR ALL USING (usuario_id = auth.uid());


-- ── configuracion_integraciones ──────────────────────────────
-- Configuración de canales de notificación por usuario.
-- Soporta Telegram, Discord (y futuros canales).
-- UNIQUE (usuario_id, tipo) para el upsert de integraciones.js.

CREATE TABLE IF NOT EXISTS configuracion_integraciones (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id     UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo           TEXT        NOT NULL,  -- 'telegram' | 'discord'
  config         JSONB       DEFAULT '{}',
  activa         BOOLEAN     DEFAULT false,
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (usuario_id, tipo)
);

ALTER TABLE configuracion_integraciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario gestiona sus integraciones"
  ON configuracion_integraciones FOR ALL USING (usuario_id = auth.uid());


-- ── qs_historico ─────────────────────────────────────────────
-- Histórico diario de Quality Score por keyword y cuenta.
-- Upsert con UNIQUE (cuenta_id, keyword_text, fecha) para idempotencia.

CREATE TABLE IF NOT EXISTS qs_historico (
  id                       UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id                UUID    NOT NULL REFERENCES cuentas_vinculadas(id) ON DELETE CASCADE,
  keyword_text             TEXT    NOT NULL,
  keyword_resource_name    TEXT,
  quality_score            INTEGER,
  creative_quality_score   TEXT,   -- 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE'
  post_click_quality_score TEXT,
  search_predicted_ctr     TEXT,
  fecha                    DATE    NOT NULL,
  UNIQUE (cuenta_id, keyword_text, fecha)
);

CREATE INDEX IF NOT EXISTS qs_historico_cuenta_fecha_idx
  ON qs_historico (cuenta_id, fecha DESC);

ALTER TABLE qs_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario ve su qs_historico"
  ON qs_historico FOR SELECT
  USING (
    cuenta_id IN (
      SELECT id FROM cuentas_vinculadas WHERE usuario_id = auth.uid()
    )
  );
