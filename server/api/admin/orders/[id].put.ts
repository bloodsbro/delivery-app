import { currentUser } from '~/server/utils/auth'
import { updateDeliveryInfo } from '~/server/repositories/orders'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me || me.role.name !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  const body = await readBody<{ address?: string; deliveryLat?: number; deliveryLng?: number; name?: string; phone?: string }>(event)
  await updateDeliveryInfo(id, body)
  return { ok: true }
})