import { currentUser } from '~/server/utils/auth'
import Joi from 'joi'
import { getCourierByUserId, updateCourierLocation } from '~/server/repositories/couriers'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me || me.role.name !== 'courier') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const body = await readBody<{ lat: number; lng: number }>(event)
  const schema = Joi.object({ lat: Joi.number().required(), lng: Joi.number().required() })
  const { error } = schema.validate(body)
  if (error) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  const courier = await getCourierByUserId(me.id)
  if (!courier) throw createError({ statusCode: 404, statusMessage: 'Courier not found' })
  const updated = await updateCourierLocation(courier.id, body.lat, body.lng)
  const nitro = useNitroApp()
  nitro.broadcast?.courierLocationUpdated?.({ courierId: courier.id, lat: body.lat, lng: body.lng })
  return { ok: true, at: updated.last_location_update }
})