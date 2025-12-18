import { toFrontVehicle } from '~/server/utils/vehicles'
import { listVehicles } from '~/server/repositories/vehicles'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me || me.role.name !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  
  const list = await listVehicles()
  return list.map(toFrontVehicle)
})
