import { toFrontOrder } from '~/server/utils/orders'
import { findByTTN } from '~/server/repositories/orders'

export default defineEventHandler(async (event) => {
  const ttn = event.context.params?.ttn
  if (!ttn) throw createError({ statusCode: 400, statusMessage: 'TTN required' })
  const order = await findByTTN(ttn)
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  return toFrontOrder(order)
})