# ADSAI PRO — MASTER PROJECT BRIEF

### SaaS de Google Ads con IA para el mercado hispanohablante

**Versión:** 1.0 — Mayo 2026  
**Propietario:** Filiberto / Zerbitecni  
**Estado:** Fase de planificación — listo para desarrollo

-----

## ÍNDICE

1. [Investigación de Mercado](#1-investigacion-de-mercado)
1. [Análisis de Competidores](#2-analisis-de-competidores)
1. [Diferenciadores Exclusivos](#3-diferenciadores-exclusivos)
1. [Stack Técnico](#4-stack-tecnico)
1. [Arquitectura de Agentes IA](#5-arquitectura-de-agentes-ia)
1. [Optimización de Tokens](#6-optimizacion-de-tokens)
1. [Frontend — Instrucciones para IA de Diseño](#7-frontend-instrucciones-para-ia-de-diseno)
1. [Estructura de Código](#8-estructura-de-codigo)
1. [Modelos de Precios](#9-modelos-de-precios)
1. [MVP — Hoja de Ruta](#10-mvp-hoja-de-ruta)

-----

## 1. INVESTIGACIÓN DE MERCADO

### Tamaño del mercado

- El mercado global de IA en publicidad alcanzó **$5.6B en 2024** y se proyecta a **$16.42B en 2029**
- Google Ads genera **$264.6B anuales** en ingresos globales
- El CPC promedio subió un **18% año a año en 2025** → la automatización es crítica para ser rentable
- El 73% de anunciantes logran ROI positivo en 4 semanas usando herramientas IA vs solo 31% manualmente

### Mercado hispanohablante (oportunidad real)

- **Todas las herramientas líderes están en inglés**, con soporte en inglés, pensadas para EEUU/UK
- España tiene un ecosistema publicitario **más fragmentado que EEUU** — muchas empresas aún migran de marketing tradicional a digital
- En España, más del **70% del tráfico publicitario viene de móvil** → las herramientas actuales no priorizan esto
- Hay más de **400M de hispanohablantes** con economías digitales en rápido crecimiento (España, México, Colombia, Argentina, Chile)
- **Ninguna herramienta top tiene interfaz nativa en español** ni soporte técnico en español

-----

## 2. ANÁLISIS DE COMPETIDORES

### Mapa de herramientas actuales (2026)

| Herramienta   | Precio/mes   | Autonomía             | Enfoque                | Debilidades clave              |
|--------------|-------------|----------------------|-----------------------|-------------------------------|
| **groas**     | $79 flat     | Alta (autónoma)       | Optimización automática | Solo inglés, sin panel agencia |
| **Optmyzr**   | $389–$799    | Media                 | Agencias multi-cuenta  | Muy caro, UI obsoleta          |
| **Adalysis**  | ~$200+       | Baja (requiere humano)| Auditoría + A/B testing | Todo manual, sin IA generativa |
| **Ryze AI**   | ~$40 flat    | Muy alta              | Gestión autónoma       | Solo inglés, sin white-label   |
| **Adzooma**   | Gratis / $99+| Media                 | Multi-plataforma       | Genérico, sin IA profunda      |
| **Madgicx**   | $44+         | Media                 | Creativos + audiencias | Enfocado en Meta más que Google|
| **WordStream** | Variable     | Baja                  | PYMEs                  | Anticuado, poco IA             |
| **smec**      | Custom ($$$) | Alta                  | eCommerce enterprise   | Solo grandes empresas, caro    |

### Lo que hace la competencia BIEN

- Automatización de pujas (Smart Bidding override)
- Alertas de rendimiento
- Reportes automáticos
- Pausar keywords con bajo rendimiento
- Sugerencias de copies

### Lo que la competencia **NO HACE** (tus diferenciadores)

→ Ver Sección 3

-----

## 3. DIFERENCIADORES EXCLUSIVOS

Estas son las características que **ninguna herramienta del mercado hispanohablante ofrece actualmente**:

### D1 — Plataforma 100% en español

- Interfaz, alertas, reportes y soporte técnico en español nativo
- Terminología adaptada (no traducción automática de conceptos anglosajones)
- Localización para España, México, Colombia, Argentina, Chile

### D2 — Asistente conversacional en español (diferenciador técnico)

- Chat con IA donde el usuario pregunta en español: "¿Por qué bajó mi CTR esta semana?"
- La IA analiza la cuenta en tiempo real y responde con contexto específico
- **Ningún competidor tiene esto.** groas/Ryze automatizan pero no explican en conversación

### D3 — Panel de ROI real (no métricas de vanidad)

- Foco en beneficio neto, no solo ROAS
- Integración opcional con datos de margen del cliente para calcular POAS real
- Competidores muestran clics e impresiones; nosotros mostramos cuánto dinero ganaste/perdiste

### D4 — Modo Agencia con white-label completo

- Reportes con logo del cliente/agencia
- URL personalizada (tuagencia.adsaipro.com)
- Acceso de cliente con permisos limitados (solo lectura de sus métricas)
- **La mayoría de competidores cobran extra por esto o directamente no lo ofrecen**

### D5 — Mobile-first para el mercado español

- Dashboard optimizado para móvil (70% del tráfico español es móvil)
- Alertas push nativas cuando una campaña necesita atención urgente
- Gestión de aprobaciones rápidas desde el móvil

### D6 — Inteligencia competitiva integrada

- Monitoreo del Google Ads Transparency Center para ver qué hacen los competidores del cliente
- Alertas cuando un competidor lanza nueva campaña o cambia su copy
- Análisis de auction insights con recomendaciones automáticas de acción

### D7 — Explicabilidad total (transparencia vs caja negra)

- Cada optimización automática incluye una explicación en lenguaje natural del porqué
- Los clientes entienden qué hace la IA, no solo los resultados
- Registro de auditoría de cada acción tomada por la IA

### D8 — Generador de copies con contexto de marca

- El usuario define su tono, sector y USPs una vez
- La IA genera copies para RSA, PMax y Display respetando esa identidad
- Puntuación de calidad predictiva antes de publicar

### D9 — Precio plano sin escalar por gasto publicitario

- La competencia escala precios según el gasto ($389/mes para cuentas de $10K/mes → carísimo)
- Modelo flat + tier por número de cuentas, no por presupuesto gestionado
- **Especialmente atractivo para PYMEs con presupuestos medianos**

-----

## 4. STACK TÉCNICO

### Frontend

```
React 18 + Vite
Tailwind CSS
Recharts (gráficos de rendimiento)
React Query (caché de datos de API)
Zustand (estado global)
```

### Backend

```
Node.js 20 + Express (o Fastify para mejor performance)
Google Ads API v23+ (última versión, enero 2026)
OAuth 2.0 con Google
JWT para autenticación interna
```

### Base de datos

```
Supabase (PostgreSQL)
  - Tabla: usuarios, cuentas_vinculadas, campañas_cache, reportes, logs_ia
Redis (caché de datos de Google Ads — evitar llamadas repetidas)
```

### IA

```
Claude claude-sonnet-4-6 (Anthropic API) — análisis y recomendaciones
Claude claude-haiku-4-5 (tareas simples) — alertas, clasificaciones básicas
Prompt caching activado para contexto de cuenta (ahorro 90% tokens repetidos)
```

### Pagos

```
Stripe (suscripciones recurrentes + gestión de planes)
```

### Infraestructura

```
Railway o Render (backend)
Vercel (frontend)
Supabase (DB + auth)
Cloudflare (CDN + protección)
```

### Google Ads API v23 (enero 2026) — Características clave

- Reportes de Performance Max con desglose por red de anuncios
- Creación de audiencias con lenguaje natural (IA nativa de Google)
- Datos de factura a nivel de campaña
- Programación con datetime preciso (no solo fecha)
- Recursos `AppliedIncentive` para gestionar créditos de cuentas (útil para agencias)

-----

## 5. ARQUITECTURA DE AGENTES IA

### Filosofía de agentes

Cada agente tiene **un único rol**, acceso solo a los datos que necesita, y usa el modelo más barato posible para su tarea. Los agentes no comparten contexto entre sí — el orquestador gestiona la coordinación.

-----

### AGENTE 0 — ORQUESTADOR (Orchestrator)

**Modelo:** claude-sonnet-4-6  
**Rol:** Recibe la solicitud del usuario, decide qué agente activar, ensambla respuestas  
**Trigger:** Toda solicitud del usuario  
**Input:** Mensaje del usuario + estado de cuenta resumido (no datos crudos)  
**Output:** Instrucciones para agente específico + respuesta final al usuario  
**Optimización tokens:** Recibe solo el resumen comprimido de cuenta, no datos RAW de API

```
TAREAS DEL ORQUESTADOR:
- Clasificar intención del usuario (consulta / alerta / acción / reporte)
- Seleccionar agente correcto
- Evitar llamadas a agentes si la respuesta está en caché
- Ensamblar respuesta final en español natural
```

-----

### AGENTE 1 — ANALISTA DE RENDIMIENTO (Performance Analyst)

**Modelo:** claude-sonnet-4-6  
**Rol:** Analizar métricas de campañas y detectar anomalías  
**Trigger:** Solicitud de análisis, cambio brusco en KPIs, reporte semanal  
**Input:** Datos de campaña del período seleccionado (pre-comprimidos)  
**Output:** Diagnóstico en español + puntos de acción priorizados

```
TAREAS:
- Detectar caídas de CTR, subidas de CPC, pérdidas de cuota de impresión
- Identificar campañas/grupos/keywords que drenan presupuesto sin convertir
- Comparar período actual vs período anterior
- Generar insight en lenguaje natural
```

-----

### AGENTE 2 — OPTIMIZADOR (Bid & Budget Optimizer)

**Modelo:** claude-sonnet-4-6  
**Rol:** Generar recomendaciones de pujas, presupuestos y estructura de campaña  
**Trigger:** Solicitud manual o ciclo automático (cada 24h si el usuario activa modo autónomo)  
**Input:** Datos de rendimiento últimos 30 días + objetivos del cliente  
**Output:** Lista de acciones concretas con justificación + opción de aplicar automáticamente

```
TAREAS:
- Calcular puja óptima por keyword según CPA objetivo
- Recomendar redistribución de presupuesto entre campañas
- Sugerir pausar/activar keywords según umbral de rendimiento
- Generar reglas automáticas (scripts de Google Ads) si el usuario lo aprueba
- CADA acción incluye explicación del porqué (diferenciador D7)
```

-----

### AGENTE 3 — COPYWRITER IA (Ad Copy Generator)

**Modelo:** claude-sonnet-4-6  
**Rol:** Generar y mejorar textos de anuncios  
**Trigger:** Solicitud de nuevo copy / auditoría de copies existentes  
**Input:** Perfil de marca (guardado en DB) + keywords objetivo + copies actuales  
**Output:** Variantes de copy para RSA, Performance Max, Display con scoring

```
TAREAS:
- Generar headlines y descriptions para RSA respetando límites de caracteres
- Analizar copies existentes y sugerir mejoras concretas
- Puntuar copies predictivamente (basado en patrones de CTR histórico)
- Detectar copies que violan políticas de Google antes de publicar
- Mantener consistencia con tono/voz de marca definida por el usuario
```

-----

### AGENTE 4 — MONITOR DE ALERTAS (Alert Monitor)

**Modelo:** claude-haiku-4-5 (barato — tarea simple de clasificación)  
**Rol:** Monitoreo continuo y generación de alertas  
**Trigger:** Cron job cada hora  
**Input:** Snapshot de KPIs actuales vs umbrales configurados  
**Output:** Alerta push/email solo cuando hay anomalía real

```
TAREAS:
- Comparar métricas actuales con umbrales personalizados
- Clasificar gravedad: INFO / AVISO / CRÍTICO
- Generar mensaje de alerta conciso en español
- Filtrar falsos positivos para no saturar al usuario
- NO usar Sonnet para esto — Haiku es suficiente y cuesta 20x menos
```

-----

### AGENTE 5 — ESPÍA COMPETITIVO (Competitor Intelligence)

**Modelo:** claude-sonnet-4-6  
**Rol:** Monitorear competidores vía Google Ads Transparency Center y Auction Insights  
**Trigger:** Semanal automático + solicitud manual  
**Input:** Lista de competidores del cliente + datos de auction insights de la cuenta  
**Output:** Reporte de movimientos competitivos + recomendaciones de respuesta

```
TAREAS:
- Consultar Google Ads Transparency Center API para ver anuncios de competidores
- Analizar cambios en cuota de impresión de competidores
- Detectar nuevas keywords donde aparecen competidores
- Sugerir estrategia de respuesta
```

-----

### AGENTE 6 — GENERADOR DE REPORTES (Report Generator)

**Modelo:** claude-haiku-4-5 (para estructura) + claude-sonnet-4-6 (para narrativa)  
**Rol:** Crear reportes white-label para clientes  
**Trigger:** Semanal/mensual automático o solicitud manual  
**Input:** Datos de rendimiento + plantilla de marca del cliente  
**Output:** PDF/HTML con branding personalizado + narrativa ejecutiva

```
TAREAS:
- Estructurar datos en formato visual (tablas, gráficos)
- Generar resumen ejecutivo en lenguaje no técnico para el cliente final
- Aplicar logo y colores de la agencia (white-label)
- Destacar los 3 logros principales y los 3 próximos pasos
- Enviar automáticamente por email al cliente si está configurado
```

-----

### AGENTE 7 — ASISTENTE CONVERSACIONAL (Conversational AI)

**Modelo:** claude-sonnet-4-6  
**Rol:** Responder preguntas libres del usuario sobre sus campañas  
**Trigger:** Cualquier mensaje libre del usuario en el chat  
**Input:** Pregunta + contexto comprimido de cuenta  
**Output:** Respuesta conversacional en español con datos específicos de la cuenta

```
TAREAS:
- Responder: "¿Por qué bajó mi ROAS esta semana?"
- Responder: "¿Cuánto gasté en keywords de marca el mes pasado?"
- Responder: "¿Qué campaña está funcionando mejor?"
- Responder: "¿Cuándo es mejor hora para publicar mis anuncios?"
- Nunca inventar datos — siempre basarse en datos reales de la cuenta
```

-----

### Diagrama de flujo de agentes

```
Usuario hace pregunta/acción
          ↓
    ORQUESTADOR (A0)
    ├── Consulta análisis → ANALISTA (A1)
    ├── Optimización → OPTIMIZADOR (A2)
    ├── Necesita copy → COPYWRITER (A3)
    ├── Alerta automática → MONITOR (A4) [cron]
    ├── Competidores → ESPÍA (A5)
    ├── Reporte → REPORTES (A6)
    └── Pregunta libre → CONVERSACIONAL (A7)
          ↓
    Respuesta final al usuario
```

-----

## 6. OPTIMIZACIÓN DE TOKENS

### Principio fundamental

> "No estás pagando por el prompt que escribiste. Estás pagando por todo el contexto acumulado."

### Estrategia por capas

#### CAPA 1 — Modelo correcto para cada tarea

| Tarea                                     | Modelo           | Coste relativo |
|------------------------------------------|-----------------|--------------|
| Alertas, clasificaciones simples          | claude-haiku-4-5 | 1x (base)     |
| Análisis, recomendaciones, copy           | claude-sonnet-4-6| 5x            |
| Tareas que requieren razonamiento complejo| claude-sonnet-4-6| 5x            |
| **NUNCA usar Opus para tareas rutinarias**| —                | 15x+          |

#### CAPA 2 — Prompt Caching (ahorro 90% en tokens repetidos)

```javascript
messages: [
  {
    role: "user",
    content: [
      {
        type: "text",
        text: CONTEXTO_ESTATICO_DE_CUENTA,  // Se cachea
        cache_control: { type: "ephemeral" }
      },
      {
        type: "text",
        text: DATOS_VARIABLES_HOY  // Siempre fresco
      },
      {
        type: "text",
        text: PREGUNTA_DEL_USUARIO
      }
    ]
  }
]
```

#### CAPA 3 — Compresión de datos antes de enviar a IA

```javascript
// MALO — datos crudos (50.000+ tokens)
const prompt = `Aquí están todas mis campañas: ${JSON.stringify(rawGoogleAdsData)}`

// BUENO — datos comprimidos (1.500-3.000 tokens)
const summary = compressAccountData(rawGoogleAdsData)
const prompt = `Resumen de cuenta: ${summary}`
```

#### CAPA 4 — Función de compresión de cuenta

```javascript
function compressAccountData(rawData) {
  return {
    periodo: rawData.dateRange,
    totalGasto: rawData.totalCost,
    totalConversiones: rawData.totalConversions,
    cpaMedio: rawData.avgCPA,
    roasGeneral: rawData.overallROAS,
    topCampanas: rawData.campaigns
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
      .map(c => ({
        nombre: c.name,
        gasto: c.cost,
        conversiones: c.conversions,
        cpa: c.cpa,
        tendencia: c.trendVsLastPeriod
      })),
    alertas: rawData.anomalies.slice(0, 5),
    keywordsProblema: rawData.keywords
      .filter(k => k.cpa > rawData.avgCPA * 2)
      .slice(0, 15)
  }
}
```

#### CAPA 5 — Batch Processing para reportes

```javascript
// Reportes de múltiples cuentas en batch (50% ahorro en API)
anthropic.beta.messages.batches.create()
```

#### CAPA 6 — Variables de entorno para ahorrar

```bash
DISABLE_NON_ESSENTIAL_MODEL_CALLS=1
MAX_THINKING_TOKENS=5000
CLAUDE_CODE_SUBAGENT_MODEL=haiku
```

#### CAPA 7 — Caché de respuestas frecuentes (Redis)

- Consultas genéricas cacheadas 1 hora → ahorro 30-40% llamadas redundantes

### Estimación de costes optimizados

| Escenario                 | Sin optimizar | Con optimizar | Ahorro |
|--------------------------|--------------|-------------|------|
| 1 usuario, consulta simple | ~3.000 tokens | ~800 tokens  | 73%   |
| Reporte semanal 1 cuenta  | ~20.000 tokens| ~4.000 tokens| 80%   |
| 10 cuentas activas/día    | ~$5/día       | ~$0.80/día   | 84%   |
| 50 cuentas activas/día    | ~$25/día      | ~$4/día      | 84%   |

-----

## 7. FRONTEND — INSTRUCCIONES PARA IA DE DISEÑO

### Brief de diseño

- **Nombre:** ADSAI PRO
- **Estilo:** Dashboard moderno, profesional, dark mode opcional
- **Colores:** Azul profundo `#1B3A6B`, verde éxito `#22C55E`, rojo alerta `#EF4444`
- **Tipografía:** Inter o Geist
- **Sensación:** "Herramienta de profesional, fácil de leer, datos claros"

### Prompt para v0.dev / Framer AI

```
Create a professional Google Ads management dashboard in React/Tailwind with:
- Dark sidebar with navigation icons
- Main content area with KPI cards (spend, conversions, CPA, ROAS)
- Line chart showing performance over time using Recharts
- Campaign table with status indicators (active/paused/warning)
- Right side panel with AI chat interface
- Color scheme: deep blue #1B3A6B primary, green #22C55E success, red #EF4444 alerts
- Professional, clean design similar to Linear or Vercel dashboard aesthetic
- Spanish language labels
- Mobile responsive
```

### Estructura de componentes React

```
src/
├── components/
│   ├── dashboard/
│   │   ├── KPICard.jsx
│   │   ├── PerformanceChart.jsx
│   │   ├── CampaignTable.jsx
│   │   └── AlertBadge.jsx
│   ├── chat/
│   │   ├── ChatPanel.jsx
│   │   ├── ChatMessage.jsx
│   │   └── ChatInput.jsx
│   ├── reports/
│   │   ├── ReportView.jsx
│   │   └── WhiteLabelHeader.jsx
│   └── shared/
│       ├── Sidebar.jsx
│       ├── TopBar.jsx
│       └── LoadingState.jsx
├── pages/
│   ├── Dashboard.jsx
│   ├── Campaigns.jsx
│   ├── Keywords.jsx
│   ├── Reports.jsx
│   ├── Competitors.jsx
│   ├── Settings.jsx
│   └── Onboarding.jsx
├── agents/
│   ├── orchestrator.js
│   ├── performanceAnalyst.js
│   ├── optimizer.js
│   ├── copywriter.js
│   ├── alertMonitor.js
│   ├── competitorSpy.js
│   ├── reportGenerator.js
│   └── conversational.js
├── api/
│   ├── googleAds.js
│   ├── anthropic.js
│   └── supabase.js
└── utils/
    ├── dataCompressor.js
    ├── cacheManager.js
    └── tokenCounter.js
```

-----

## 8. ESTRUCTURA DE CÓDIGO

### Backend — Endpoints principales

```
POST /api/auth/google        → OAuth con Google
POST /api/accounts/link      → Vincular cuenta Google Ads
GET  /api/accounts/:id/summary → Resumen comprimido de cuenta
GET  /api/campaigns          → Lista de campañas
POST /api/ai/chat            → Agente conversacional
POST /api/ai/analyze         → Agente analista
POST /api/ai/optimize        → Agente optimizador
POST /api/ai/copy            → Agente copywriter
POST /api/reports/generate   → Generador de reportes
GET  /api/competitors        → Inteligencia competitiva
```

### Google Ads API — Queries GAQL clave

```sql
-- Rendimiento de campañas (últimos 30 días)
SELECT 
  campaign.name, campaign.status,
  metrics.cost_micros, metrics.conversions,
  metrics.ctr, metrics.average_cpc,
  metrics.conversion_value
FROM campaign
WHERE segments.date DURING LAST_30_DAYS

-- Keywords problemáticas (CPA alto)
SELECT 
  ad_group_criterion.keyword.text,
  metrics.cost_micros, metrics.conversions,
  metrics.ctr, metrics.quality_score
FROM keyword_view
WHERE segments.date DURING LAST_30_DAYS
  AND metrics.cost_micros > 5000000

-- Auction Insights (competidores)
SELECT
  auction_insight.domain,
  auction_insight.impression_share,
  auction_insight.overlap_rate,
  auction_insight.outranking_share
FROM auction_insight_performance_view
```

### Sistema de caché Redis

```javascript
const CACHE_TTL = {
  ACCOUNT_SUMMARY: 3600,
  CAMPAIGN_LIST: 1800,
  AI_RESPONSE_SIMPLE: 3600,
  COMPETITOR_DATA: 86400,
  REPORT_GENERATED: 604800
}
```

### Variables de entorno (.env)

```bash
# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=xxx
GOOGLE_ADS_CLIENT_ID=xxx
GOOGLE_ADS_CLIENT_SECRET=xxx
GOOGLE_ADS_LOGIN_CUSTOMER_ID=xxx

# Anthropic
ANTHROPIC_API_KEY=xxx
CLAUDE_DEFAULT_MODEL=claude-sonnet-4-6
CLAUDE_CHEAP_MODEL=claude-haiku-4-5
MAX_TOKENS_PER_REQUEST=2000
ENABLE_PROMPT_CACHING=true

# Supabase
SUPABASE_URL=xxx
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Redis
REDIS_URL=xxx
REDIS_TOKEN_CACHE_TTL=3600

# Stripe
STRIPE_SECRET_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx

# App
JWT_SECRET=xxx
FRONTEND_URL=https://tudominio.com
NODE_ENV=production
```

-----

## 9. MODELOS DE PRECIOS

### Plan Básico — 29€/mes
- 1 cuenta Google Ads
- Dashboard + análisis básico
- Chat con IA (50 consultas/mes)
- Alertas automáticas
- Reportes semanales (sin white-label)

### Plan Profesional — 79€/mes
- Hasta 5 cuentas Google Ads
- Todos los agentes IA activados
- Chat ilimitado
- Reportes con white-label básico
- Inteligencia competitiva
- Generador de copies

### Plan Agencia — 199€/mes
- Hasta 25 cuentas Google Ads
- White-label completo (URL personalizada)
- Portal de cliente con acceso limitado
- Reportes automáticos por email a clientes
- API access para integraciones
- Soporte prioritario

### Rentabilidad estimada

| Clientes | Ingresos/mes | Costes API | Infra | Beneficio |
|---------|------------|----------|-----|---------|
| 5 básicos | 145€        | ~5€       | ~40€ | ~100€    |
| 20 mixtos | 900€        | ~20€      | ~50€ | ~830€    |
| 50 mixtos | 2.500€      | ~50€      | ~80€ | ~2.370€  |

-----

## 10. MVP — HOJA DE RUTA

### FASE 0 — Configuración (Semana 1)

- [ ] Crear proyecto GitHub: `adsai-pro`
- [ ] Setup React+Vite frontend
- [ ] Setup Node.js+Express backend
- [ ] Configurar Supabase (schema inicial)
- [ ] Obtener Developer Token de Google Ads API
- [ ] Configurar Anthropic API key

### FASE 1 — MVP Core (Semanas 2-4)

- [ ] OAuth con Google (vincular cuenta)
- [ ] Leer datos básicos via Google Ads API
- [ ] Dashboard con KPIs principales
- [ ] Agente 1: Analista básico (texto)
- [ ] Agente 7: Chat conversacional básico

### FASE 2 — Agentes principales (Semanas 5-7)

- [ ] Agente 2: Optimizador con recomendaciones
- [ ] Agente 3: Copywriter
- [ ] Agente 4: Monitor de alertas (cron)
- [ ] Sistema de caché Redis
- [ ] Optimización de tokens (data compressor)

### FASE 3 — Agencia y white-label (Semanas 8-10)

- [ ] Multi-cuenta (hasta 5)
- [ ] Agente 6: Reportes white-label
- [ ] Portal básico de cliente
- [ ] Integración Stripe (pagos)

### FASE 4 — Diferenciadores avanzados (Semanas 11-14)

- [ ] Agente 5: Espía competitivo
- [ ] Mobile responsive optimizado
- [ ] Alertas push
- [ ] White-label completo con URL personalizada

### FASE 5 — Lanzamiento (Semana 15)

- [ ] Landing page en español
- [ ] Beta con 5 usuarios reales
- [ ] Sistema de feedback
- [ ] Ajustes post-beta
- [ ] Launch Product Hunt España

-----

## NOTAS FINALES

### GitHub

- **Usuario:** juniorsmax
- **Repo:** `juniorsmax/adsai-pro`
- **Branches:** `main` (producción) / `dev` (desarrollo) / `feature/[nombre]`

### Recursos clave

- Google Ads API: https://developers.google.com/google-ads/api/docs/start
- Anthropic API (prompt caching): https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- Supabase docs: https://supabase.com/docs
- groas (competidor): https://groas.ai
- Optmyzr (competidor): https://www.optmyzr.com

---

*Documento generado: Mayo 2026 — Claude Sonnet 4.6*  
*Actualizar tras cada sprint de desarrollo*
