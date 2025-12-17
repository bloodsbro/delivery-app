import prisma from '~/lib/prisma'
import { currentUser } from '~/server/utils/auth'
import { toFrontOrder } from '~/server/utils/orders'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const customer = await prisma.customer.findFirst({ where: { user_id: me.id }, select: { id: true } })
  if (!customer) return []
  const list = await prisma.order.findMany({ where: { customer_id: customer.id }, include: { customer: { include: { user: true } }, status: true, delivery: { include: { courier: { include: { user: true } } } } }, orderBy: { created_at: 'desc' } })
  return list.map(toFrontOrder)
})