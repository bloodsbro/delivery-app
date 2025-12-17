import { toFrontVehicle } from '~/server/utils/vehicles'
import { listVehicles } from '~/server/repositories/vehicles'

export default defineEventHandler(async () => {
  const list = await listVehicles()
  return list.map(toFrontVehicle)
})
