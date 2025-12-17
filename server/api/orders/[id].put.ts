import type { Order } from '~/types/order'
import { toFrontOrder } from '~/server/utils/orders'
import { updateStatusByFront, findById } from '~/server/repositories/orders'
import Joi from 'joi'
import { createNotification } from '~/server/repositories/notifications'
import { createLog } from '~/server/repositories/logs'

export default defineEventHandler(async (event) => {
  const orderId = event.context.params?.id
  const body = await readBody<{ status?: Order['status'] }>(event)
  const schema = Joi.object({ status: Joi.string().valid('pending','processing','shipped','delivered','cancelled').optional() })
  const { error } = schema.validate(body)
  if (error) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  if (!orderId) throw createError({ statusCode: 400, statusMessage: 'Order ID is required' })

  const exists = await findById(orderId)
  if (!exists) throw createError({ statusCode: 404, statusMessage: 'Order not found' })

  if (body.status) await updateStatusByFront(orderId, body.status)

  const updated = await findById(orderId)
  if (updated?.customer?.user?.id) {
    await createNotification({ userId: updated.customer.user.id, type: 'in_app', title: 'Статус замовлення оновлено', content: `Статус замовлення #${updated.order_number} змінено на ${updated.status?.name}`, relatedEntityType: 'order', relatedEntityId: updated.id })
  }
  await createLog({ userId: updated?.customer?.user?.id ?? undefined, action: 'order_status_updated', entityType: 'order', entityId: updated?.id, data: { status: body.status } })
  const nitro = useNitroApp()
  nitro.broadcast?.orderStatusChanged({ id: updated?.id, status: updated?.status?.name })
  return toFrontOrder(updated)
})
