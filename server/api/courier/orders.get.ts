import prisma from '~/lib/prisma'
import { currentUser } from '~/server/utils/auth'
import { toFrontOrder } from '~/server/utils/orders'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me || me.role.name !== 'courier') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const courier = await prisma.courier.findFirst({ where: { user_id: me.id } })
  if (!courier) return []
  const deliveries = await prisma.delivery.findMany({ where: { courier_id: courier.id }, include: { order: { include: { customer: { include: { user: true } }, status: true, delivery: { include: { courier: { include: { user: true } } } } } } } })
  return deliveries.map(d => toFrontOrder(d.order))
})
