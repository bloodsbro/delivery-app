import { requirePermission } from '~/server/utils/rbac'
import { PERMISSIONS } from '~/utils/permissions'
import { toFrontOrder } from '~/server/utils/orders'
import { findUnassigned } from '~/server/repositories/orders'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.MANAGE_ORDERS)
  const list = await findUnassigned()
  
  return list.map(toFrontOrder)
})