-- Sistema de conocimiento aprendido: reglas que el sistema aprende con el tiempo
-- Evita llamar a Claude cuando ya existe una respuesta de calidad para esa situación

CREATE TABLE IF NOT EXISTS learned_rules (
  id                   UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id           UUID         REFERENCES cuentas_vinculadas(id) ON DELETE CASCADE,
  agente               TEXT         NOT NULL,         -- 'analista' | 'optimizador'
  condicion_key        TEXT         NOT NULL,         -- señales serializadas: "cpa_alto+sin_conversiones"
  condicion            JSONB        NOT NULL,         -- { "signals": ["cpa_alto", "sin_conversiones"] }
  accion               TEXT         NOT NULL,         -- respuesta almacenada (texto o JSON serializado)
  veces_aplicada       INTEGER      DEFAULT 0,        -- cuántas veces se sirvió la regla en vez de Claude
  tasa_exito           NUMERIC(5,2) DEFAULT 80,       -- 0-100, revisado semanalmente por Claude
  ultima_actualizacion TIMESTAMPTZ  DEFAULT NOW(),
  creado_en            TIMESTAMPTZ  DEFAULT NOW()
);

-- Unicidad: una regla por (cuenta, agente, condición)
CREATE UNIQUE INDEX IF NOT EXISTS learned_rules_unique
  ON learned_rules (account_id, agente, condicion_key);

-- Índice para búsqueda rápida antes de cada llamada IA
CREATE INDEX IF NOT EXISTS learned_rules_lookup
  ON learned_rules (account_id, agente, tasa_exito DESC);

-- Solo el propio usuario puede ver sus reglas
ALTER TABLE learned_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario lee sus reglas"
  ON learned_rules FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM cuentas_vinculadas WHERE usuario_id = auth.uid()
    )
  );

-- Función atómica para incrementar veces_aplicada (evita race conditions)
CREATE OR REPLACE FUNCTION increment_rule_usage(rule_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE learned_rules
  SET veces_aplicada = veces_aplicada + 1,
      ultima_actualizacion = NOW()
  WHERE id = rule_id;
END;
$$;
