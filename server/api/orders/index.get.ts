import { toFrontOrder } from '~/server/utils/orders'
import { findMany } from '~/server/repositories/orders'

export default defineEventHandler(async () => {
  const list = await findMany()
  return list.map(toFrontOrder)
})
