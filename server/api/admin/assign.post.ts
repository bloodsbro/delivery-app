import { currentUser } from '~/server/utils/auth'
import { assignOrderToCourier, getCourierById } from '~/server/repositories/couriers'
import Joi from 'joi'
import { createNotification } from '~/server/repositories/notifications'
import { createLog } from '~/server/repositories/logs'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me || me.role.name !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const body = await readBody<{ orderId: string; courierId: string }>(event)
  const schema = Joi.object({ orderId: Joi.string().trim().required(), courierId: Joi.string().trim().required() })
  const { error } = schema.validate(body)
  if (error) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  await assignOrderToCourier(body.orderId, body.courierId)
  const courier = await getCourierById(body.courierId)
  if (courier?.user?.id) {
    await createNotification({ userId: courier.user.id, type: 'in_app', title: 'Нове призначення', content: `Вам призначено замовлення ${body.orderId}`, relatedEntityType: 'order', relatedEntityId: body.orderId })
  }
  await createLog({ userId: me.id, action: 'order_assigned', entityType: 'order', entityId: body.orderId, data: { courierId: body.courierId } })
  const nitro = useNitroApp()
  nitro.broadcast?.orderAssigned({ orderId: body.orderId, courierId: body.courierId })
  return { ok: true }
})