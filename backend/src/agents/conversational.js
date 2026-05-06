const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic()

const SYSTEM_PROMPT = `Eres el Asistente Conversacional de ADSAI PRO, experto en Google Ads, integrado directamente en el dashboard del usuario.

Tu rol:
- Responder preguntas del usuario sobre sus campañas en lenguaje natural y en español
- Interpretar los datos de la cuenta para dar respuestas específicas y útiles
- Guiar al usuario hacia decisiones basadas en datos reales

Reglas:
- Responde SIEMPRE en español, con tono profesional y cercano
- Nunca inventes datos — si no hay datos disponibles, indícalo claramente
- Sé conversacional pero preciso: respuestas de 2-4 párrafos máximo
- Cuando detectes un problema, sugiere siempre un próximo paso concreto
- No uses jerga técnica innecesaria — el usuario puede ser un gestor de marketing, no un técnico
- Si la pregunta no está relacionada con Google Ads o marketing digital, redirige amablemente`

async function chat(pregunta, historial, accountSummary) {
  const contextoTexto = accountSummary
    ? `CONTEXTO DE LA CUENTA (datos actuales):\n${JSON.stringify(accountSummary, null, 2)}`
    : 'No hay datos de cuenta disponibles aún.'

  // Construir mensajes: contexto cacheado + historial + pregunta actual
  const mensajes = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: contextoTexto,
          cache_control: { type: 'ephemeral' }, // El contexto de cuenta se cachea
        },
        {
          type: 'text',
          text: `Pregunta del usuario: ${pregunta}`,
        },
      ],
    },
  ]

  // Añadir historial de conversación si existe (máximo últimos 10 turnos)
  if (historial?.length > 0) {
    const historialReciente = historial.slice(-10)
    mensajes[0].content.splice(1, 0, {
      type: 'text',
      text: `Historial de conversación:\n${historialReciente.map(m => `${m.rol === 'usuario' ? 'Usuario' : 'Asistente'}: ${m.texto}`).join('\n')}`,
    })
  }

  const response = await client.messages.create({
    model: process.env.CLAUDE_DEFAULT_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: mensajes,
  })

  return response.content[0].text
}

module.exports = { chat }
