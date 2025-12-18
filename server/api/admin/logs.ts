import { requirePermission } from '~/server/utils/rbac'
import { PERMISSIONS } from '~/utils/permissions'
import { listLogs } from '~/server/repositories/logs'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.VIEW_LOGS)
  const limitRaw = Number(getQuery(event).limit || 100)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 100
  const logs = await listLogs(limit)
  
  return logs
})