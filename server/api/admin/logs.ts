import { currentUser } from '~/server/utils/auth'
import { listLogs } from '~/server/repositories/logs'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me || me.role.name !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const limitRaw = Number(getQuery(event).limit || 100)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 100
  const logs = await listLogs(limit)
  return logs
})