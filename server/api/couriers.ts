import { listCouriersRaw } from '~/server/repositories/couriers'

export default defineEventHandler(async () => {
  const list = await listCouriersRaw()
  return list
})