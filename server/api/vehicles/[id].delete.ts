import { currentUser } from '~/server/utils/auth'
import { deleteVehicle } from '~/server/repositories/vehicles'
import { createLog } from '~/server/repositories/logs'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  const me = await currentUser(event)
  if (!me || me.role.name !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  await deleteVehicle(id)
  await createLog({ userId: me.id, action: 'vehicle_deleted', entityType: 'vehicle', entityId: id })
  return { ok: true }
})