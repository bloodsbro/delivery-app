import { requirePermission } from '~/server/utils/rbac'
import { PERMISSIONS } from '~/utils/permissions'
import { deleteVehicle } from '~/server/repositories/vehicles'
import { createLog } from '~/server/repositories/logs'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  const me = await requirePermission(event, PERMISSIONS.MANAGE_VEHICLES)
  await deleteVehicle(id)
  await createLog({ userId: me.id, action: 'vehicle_deleted', entityType: 'vehicle', entityId: id })
  return { ok: true }
})