const Redis = require('ioredis')

const TTL = {
  ACCOUNT_SUMMARY: 3600,
  CAMPAIGN_LIST: 1800,
  AI_RESPONSE: 3600,
  COMPETITOR_DATA: 86400,
  REPORT: 604800,
}

let redis = null

function getClient() {
  if (!redis && process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL)
    redis.on('error', (err) => console.error('[Redis]', err.message))
  }
  return redis
}

async function get(key) {
  const client = getClient()
  if (!client) return null
  const val = await client.get(key)
  return val ? JSON.parse(val) : null
}

async function set(key, value, ttlKey = 'ACCOUNT_SUMMARY') {
  const client = getClient()
  if (!client) return
  const ttl = typeof ttlKey === 'number' ? ttlKey : (TTL[ttlKey] ?? 3600)
  await client.set(key, JSON.stringify(value), 'EX', ttl)
}

async function del(key) {
  const client = getClient()
  if (!client) return
  await client.del(key)
}

module.exports = { get, set, del, TTL, getClient }
