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
  const mensajes = buildMessages(pregunta, historial, accountSummary)

  const response = await client.messages.create({
    model: process.env.CLAUDE_SONNET ?? 'claude-sonnet-4-6',
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: mensajes,
  })

  return { data: response.content[0].text, usage: response.usage, model: response.model }
}

// Construye el array de mensajes (reutilizado por chat y chatStream)
function buildMessages(pregunta, historial, accountSummary) {
  const contextoTexto = accountSummary
    ? `CONTEXTO DE LA CUENTA (datos actuales):\n${JSON.stringify(accountSummary, null, 2)}`
    : 'No hay datos de cuenta disponibles aún.'

  const mensajes = [
    {
      role: 'user',
      content: [
        { type: 'text', text: contextoTexto, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: `Pregunta del usuario: ${pregunta}` },
      ],
    },
  ]

  if (historial?.length > 0) {
    const historialReciente = historial.slice(-10)
    mensajes[0].content.splice(1, 0, {
      type: 'text',
      text: `Historial de conversación:\n${historialReciente.map(m => `${m.rol === 'usuario' ? 'Usuario' : 'Asistente'}: ${m.texto}`).join('\n')}`,
    })
  }

  return mensajes
}

// Variante streaming: envía deltas de texto vía la función sse() proporcionada
async function chatStream(pregunta, historial, accountSummary, sse) {
  const mensajes = buildMessages(pregunta, historial, accountSummary)

  const stream = client.messages.stream({
    model: process.env.CLAUDE_SONNET ?? 'claude-sonnet-4-6',
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: mensajes,
  })

  for await (const text of stream.textStream) {
    sse('delta', { text })
  }

  const msg = await stream.finalMessage()
  return { usage: msg.usage, model: msg.model }
}

module.exports = { chat, chatStream }
