import type { NewOrder } from '~/types/order'
import { v4 as uuidv4 } from 'uuid'
import { toFrontOrder } from '~/server/utils/orders'
import { findOrCreateCustomerByPhone } from '~/server/repositories/customers'
import { createOrderRecord } from '~/server/repositories/orders'
import Joi from 'joi'
import { createNotification } from '~/server/repositories/notifications'
import { createLog } from '~/server/repositories/logs'

export default defineEventHandler(async (event) => {
  const body = await readBody<NewOrder & { deliveryLat?: number; deliveryLng?: number }>(event);
  const schema = Joi.object({
    customerName: Joi.string().trim().min(2).required(),
    customerAddress: Joi.string().trim().min(3).required(),
    customerPhone: Joi.string().trim().pattern(/^[+]?\d{10,15}$/).required(),
    items: Joi.array().items(Joi.object({ name: Joi.string().trim().min(1).required(), quantity: Joi.number().integer().min(1).required(), price: Joi.number().min(0).required() })).min(1).required(),
    deliveryLat: Joi.number().optional(),
    deliveryLng: Joi.number().optional(),
    weight: Joi.number().optional(),
    volume: Joi.number().optional(),
  })
  const { error } = schema.validate(body)
  if (error) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const orderNumber = `TTN-${Date.now()}-${uuidv4().slice(0,8)}`
  const customerId = await findOrCreateCustomerByPhone(body.customerName, body.customerPhone, body.customerAddress)

  const price = body.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const created = await createOrderRecord({ orderNumber, customerId, customerAddress: body.customerAddress, customerName: body.customerName, customerPhone: body.customerPhone, items: body.items, price, deliveryLat: body.deliveryLat, deliveryLng: body.deliveryLng, weight: body.weight, volume: body.volume, statusName: 'pending' })
  await createNotification({ userId: created.customer.user.id, type: 'in_app', title: 'Замовлення створено', content: `Ваше замовлення #${created.order_number} успішно створено`, relatedEntityType: 'order', relatedEntityId: created.id })
  await createLog({ userId: created.customer.user.id, action: 'order_created', entityType: 'order', entityId: created.id, data: { items: body.items, price } })
  const nitro = useNitroApp()
  nitro.broadcast?.orderCreated({ id: created.id, ttn: created.order_number })

  return toFrontOrder(created)
})
