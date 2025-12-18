import { toFrontVehicle, mapVehicleTypeFrontToDb, mapVehicleStatusFrontToDb } from '~/server/utils/vehicles'
import { currentUser } from '~/server/utils/auth'
import { updateVehicle } from '~/server/repositories/vehicles'
import Joi from 'joi'
import { createLog } from '~/server/repositories/logs'
import type { Vehicle } from '~/types/vehicle'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  const me = await currentUser(event)
  if (!me || me.role.name !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const body = await readBody<{ type?: string; model?: string; licensePlate?: string; capacity?: number; status?: string }>(event)
  const schema = Joi.object({
    type: Joi.string().valid('car','van','motorcycle').optional(),
    model: Joi.string().allow('').optional(),
    licensePlate: Joi.string().allow('').optional(),
    capacity: Joi.number().min(0).optional(),
    status: Joi.string().valid('available','maintenance','in_delivery').optional(),
  })
  const { error } = schema.validate(body)
  if (error) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  const updated = await updateVehicle(id, { type: (mapVehicleTypeFrontToDb(body.type as Vehicle["type"])) ?? undefined, model: body.model ?? undefined, licensePlate: body.licensePlate ?? undefined, capacity: body.capacity ?? undefined, status: (mapVehicleStatusFrontToDb(body.status as Vehicle['status'])) ?? undefined })
  await createLog({ userId: me.id, action: 'vehicle_updated', entityType: 'vehicle', entityId: id, data: { ...body } })
  return toFrontVehicle(updated)
})