// services/redis/streams.js
const { getRedis } = require('@/service')

const streamKey = (callId) => `call:status:${String(callId)}`
const TERMINAL = new Set(['completed', 'busy', 'not-reachable', 'no-answer', 'failed', 'cancelled'])
const isTerminal = s => TERMINAL.has(String(s || '').toLowerCase())

async function xaddCallStatus (callId, status, payload = {}) {
  const redis = getRedis()
  return redis.xadd(
    streamKey(callId),
    'MAXLEN', '~', 200,
    '*',
    'status', String(status),
    'payload', JSON.stringify(payload || {})
  )
}

function toObject (arr) {
  const o = {}
  for (let i = 0; i < arr.length; i += 2) o[arr[i]] = arr[i + 1]
  if (o.payload) { try { o.payload = JSON.parse(o.payload) } catch {} }
  return o
}

async function waitForTerminalViaStream (callId, {
  timeoutMs = 300000,
  blockMs = 15000,
  preCheck
} = {}) {
  const redis = getRedis()
  const key = streamKey(callId)

  // 0) Optional pre-check (e.g., Mongo)
  if (typeof preCheck === 'function') {
    const pre = await preCheck()
    if (pre?.status && isTerminal(pre.status)) {
      return pre
    }
  }

  const deadline = Date.now() + timeoutMs

  let lastId
  const last = await redis.xrevrange(key, '+', '-', 'COUNT', 1)
  if (last.length) {
    const [foundId, fields] = last[0]
    const obj = toObject(fields)
    if (obj.status && isTerminal(obj.status)) return obj
    lastId = foundId
  } else {
    lastId = '0-0'
  }

  while (Date.now() < deadline) {
    const thisBlock = Math.min(blockMs, Math.max(1, deadline - Date.now()))
    const res = await redis.xread('BLOCK', thisBlock, 'STREAMS', key, lastId)
    console.log('[STREAM] xread result:', res)
    if (!res) continue

    const [, entries] = res[0]
    for (const [id, kv] of entries) {
      lastId = id
      const obj = toObject(kv)
      console.log('[STREAM] got entry:', id, obj)
      if (obj.status && isTerminal(obj.status)) return obj
    }
  }

  throw new Error('timeout waiting for terminal status')
}

module.exports = { xaddCallStatus, waitForTerminalViaStream, isTerminal }
