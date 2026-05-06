-- Tabla de uso de tokens de IA por usuario
-- Permite: contador mensual por plan, coste acumulado, auditoría

CREATE TABLE IF NOT EXISTS uso_tokens (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  agente        TEXT        NOT NULL,          -- 'orquestador', 'analista', 'optimizador', etc.
  modelo        TEXT        NOT NULL,          -- 'claude-sonnet-4-6', 'claude-haiku-4-5', etc.
  tokens_input  INTEGER     NOT NULL DEFAULT 0,
  tokens_output INTEGER     NOT NULL DEFAULT 0,
  coste_usd     NUMERIC(10, 6) NOT NULL DEFAULT 0,
  es_principal  BOOLEAN     NOT NULL DEFAULT TRUE, -- FALSE para llamadas internas (detectIntent)
  creado_en     TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas de uso mensual por usuario (planLimiter — filtra es_principal=true)
CREATE INDEX IF NOT EXISTS uso_tokens_usuario_mes
  ON uso_tokens (usuario_id, es_principal, creado_en DESC);

-- Índice para consultas de coste diario total
CREATE INDEX IF NOT EXISTS uso_tokens_fecha
  ON uso_tokens (creado_en DESC);

-- Row Level Security: solo el propio usuario puede leer sus registros
ALTER TABLE uso_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios leen su propio uso"
  ON uso_tokens FOR SELECT
  USING (auth.uid() = usuario_id);

-- El backend usa service key → acceso total desde el servidor
