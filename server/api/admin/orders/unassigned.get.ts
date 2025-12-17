import { currentUser } from '~/server/utils/auth'
import { toFrontOrder } from '~/server/utils/orders'
import { findUnassigned } from '~/server/repositories/orders'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me || me.role.name !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const list = await findUnassigned()
  return list.map(toFrontOrder)
})