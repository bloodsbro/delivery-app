import { currentUser } from '~/server/utils/auth'
import { listCouriersWithUser } from '~/server/repositories/couriers'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me || me.role.name !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const list = await listCouriersWithUser()
  return list.map(c => ({ id: c.id, user: { first_name: c.user.first_name, last_name: c.user.last_name } }))
})