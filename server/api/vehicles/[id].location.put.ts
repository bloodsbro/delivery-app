import { currentUser } from '~/server/utils/auth'
import Joi from 'joi'
import { updateVehicle } from '~/server/repositories/vehicles'
import { toFrontVehicle } from '~/server/utils/vehicles'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  const me = await currentUser(event)
  if (!me || me.role.name !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const body = await readBody<{ lat: number; lng: number }>(event)
  const schema = Joi.object({ lat: Joi.number().required(), lng: Joi.number().required() })
  const { error } = schema.validate(body)
  if (error) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  const updated = await updateVehicle(id, { currentLat: body.lat, currentLng: body.lng })
  return toFrontVehicle(updated)
})
