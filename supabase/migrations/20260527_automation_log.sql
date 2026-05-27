CREATE TABLE IF NOT EXISTS automation_log (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id   UUID        NOT NULL REFERENCES cuentas_vinculadas(id) ON DELETE CASCADE,
  usuario_id  UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo_accion TEXT        NOT NULL,
  target_id   TEXT,
  motivo      TEXT,
  resultado   TEXT        NOT NULL DEFAULT 'ejecutado',  -- 'ejecutado' | 'rechazado' | 'error'
  detalle     JSONB,
  creado_en   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS automation_log_cuenta_idx ON automation_log (cuenta_id, creado_en DESC);
ALTER TABLE automation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuario ve su automation_log" ON automation_log FOR ALL USING (usuario_id = auth.uid());
