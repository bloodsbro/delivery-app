import { requirePermission } from '~/server/utils/rbac'
import { PERMISSIONS } from '~/utils/permissions'
import { listCouriersWithUser } from '~/server/repositories/couriers'

export default defineEventHandler(async (event) => {
  const me = await requirePermission(event, PERMISSIONS.MANAGE_ORDERS)
  const list = await listCouriersWithUser()
  return list.map(c => ({ id: c.id, user: { first_name: c.user.first_name, last_name: c.user.last_name } }))
})