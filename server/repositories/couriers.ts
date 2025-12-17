import prisma from '~/lib/prisma'

export async function listCouriersWithUser() {
  return prisma.courier.findMany({ include: { user: true }, orderBy: { created_at: 'desc' } })
}

export async function listCouriersRaw() {
  return prisma.courier.findMany({ include: { user: true } })
}

export async function assignOrderToCourier(orderId: string, courierId: string) {
  const courier = await prisma.courier.findUnique({ where: { id: courierId } })
  if (!courier) throw createError({ statusCode: 404, statusMessage: 'Courier not found' })
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  const assignedStatusId = (await prisma.status.findFirst({ where: { name: 'assigned', type: 'order' } }))?.id
    ?? (await prisma.status.create({ data: { name: 'assigned', type: 'order' } })).id
  const confirmedStatusId = (await prisma.status.findFirst({ where: { name: 'confirmed', type: 'order' } }))?.id
    ?? (await prisma.status.create({ data: { name: 'confirmed', type: 'order' } })).id
  await prisma.delivery.upsert({ where: { order_id: order.id }, create: { order_id: order.id, courier_id: courier.id, status_id: assignedStatusId }, update: { courier_id: courier.id, status_id: assignedStatusId } })
  await prisma.order.update({ where: { id: order.id }, data: { status_id: confirmedStatusId } })
}

export async function getCourierById(id: string) {
  return prisma.courier.findUnique({ where: { id }, include: { user: true } })
}

export async function getCourierByUserId(userId: string) {
  return prisma.courier.findUnique({ where: { user_id: userId }, include: { user: true } })
}

export async function updateCourierLocation(courierId: string, lat: number, lng: number) {
  return prisma.courier.update({ where: { id: courierId }, data: { current_latitude: lat as any, current_longitude: lng as any, last_location_update: new Date() } })
}