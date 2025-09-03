// services/redis/streams.js
const { Statics } = require('@/models')
const { db } = require('@/service')
const redis = require('@/service/redis')

const TERMINAL = new Set(['completed', 'busy', 'not-reachable', 'no-answer', 'failed', 'cancelled'])
const isTerminal = s => TERMINAL.has(String(s || '').toLowerCase())

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
  console.log(redis)
  const redisConnection = redis.getRedis()
  const key = `call:status:${String(callId)}`

  if (typeof preCheck === 'function') {
    const pre = await preCheck()
    if (pre?.status && isTerminal(pre.status)) {
      return pre
    }
  }

  const deadline = Date.now() + timeoutMs

  let lastId
  const last = await redisConnection.xrevrange(key, '+', '-', 'COUNT', 1)
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
    const res = await redisConnection.xread('BLOCK', thisBlock, 'STREAMS', key, lastId)
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

async function getServerCapacity () {
  const doc = await db.findOne(
    Statics,
    {},
    { select: 'serverCapacity', lean: true }
  )
  return doc ? doc.serverCapacity : 0
}
module.exports = { waitForTerminalViaStream, isTerminal, getServerCapacity }
