import prisma from '~/lib/prisma'
import type { Order } from '~/types/order'
import { mapStatusFrontToDb } from '~/server/utils/orders'

export async function ensureOrderStatus(name: string) {
  const found = await prisma.status.findFirst({ where: { name, type: 'order' }, select: { id: true } })
  if (found?.id) return found.id
  const created = await prisma.status.create({ data: { name, type: 'order' } })
  return created.id
}

export async function createOrderRecord(input: { orderNumber: string; customerId: string; customerAddress: string; customerName: string; customerPhone: string; items: any; price: number; deliveryLat?: number; deliveryLng?: number; statusName?: string; weight?: number; volume?: number }) {
  const statusId = await ensureOrderStatus(input.statusName || 'pending')
  const created = await prisma.order.create({
    data: {
      order_number: input.orderNumber,
      customer_id: input.customerId,
      status_id: statusId,
      pickup_address: 'Склад',
      delivery_address: input.customerAddress,
      delivery_contact_name: input.customerName,
      delivery_contact_phone: input.customerPhone,
      items: typeof input.items === 'string' ? input.items : JSON.stringify(input.items),
      price: input.price,
      payment_status: 'pending',
      delivery_latitude: input.deliveryLat ?? undefined,
      delivery_longitude: input.deliveryLng ?? undefined,
      weight: input.weight ?? undefined,
      volume: input.volume ?? undefined,
    },
    include: { customer: { include: { user: true } }, status: true, delivery: { include: { courier: { include: { user: true } } } } },
  })
  return created
}

export async function updateStatusByFront(id: string, status: Order['status']) {
  const target = mapStatusFrontToDb(status)
  const statusId = await ensureOrderStatus(target)
  await prisma.order.update({ where: { id }, data: { status_id: statusId } })
}

export async function updateDeliveryInfo(id: string, payload: { address?: string; deliveryLat?: number; deliveryLng?: number; name?: string; phone?: string }) {
  const data: any = {}
  if (payload.address != null) data.delivery_address = payload.address
  if (payload.deliveryLat != null) data.delivery_latitude = payload.deliveryLat
  if (payload.deliveryLng != null) data.delivery_longitude = payload.deliveryLng
  if (payload.name != null) data.delivery_contact_name = payload.name
  if (payload.phone != null) data.delivery_contact_phone = payload.phone
  await prisma.order.update({ where: { id }, data })
}

export async function findById(id: string) {
  return prisma.order.findUnique({ where: { id }, include: { customer: { include: { user: true } }, status: true, delivery: { include: { courier: { include: { user: true } } } } } })
}

export async function findByTTN(ttn: string) {
  return prisma.order.findFirst({ where: { order_number: ttn }, include: { customer: { include: { user: true } }, status: true, delivery: { include: { courier: { include: { user: true } } } } } })
}

export async function findMany() {
  return prisma.order.findMany({ include: { customer: { include: { user: true } }, status: true, delivery: { include: { courier: { include: { user: true } } } } }, orderBy: { created_at: 'desc' } })
}

export async function findUnassigned() {
  return prisma.order.findMany({ where: { delivery: null }, include: { customer: { include: { user: true } }, status: true, delivery: { include: { courier: { include: { user: true } } } } }, orderBy: { created_at: 'desc' } })
}
