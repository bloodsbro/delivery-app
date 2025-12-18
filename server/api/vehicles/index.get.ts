import { toFrontVehicle } from '~/server/utils/vehicles'
import { listVehicles } from '~/server/repositories/vehicles'
import { requirePermission } from '~/server/utils/rbac'
import { PERMISSIONS } from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.MANAGE_VEHICLES)
  
  const list = await listVehicles()
  return list.map(toFrontVehicle)
})
