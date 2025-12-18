import { toFrontVehicle, mapVehicleTypeFrontToDb, mapVehicleStatusFrontToDb } from '~/server/utils/vehicles'
import { currentUser } from '~/server/utils/auth'
import { createVehicle } from '~/server/repositories/vehicles'
import Joi from 'joi'
import { createLog } from '~/server/repositories/logs'
import type { Vehicle } from '~/types/vehicle'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me || me.role.name !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const body = await readBody<{ type: string; model?: string; licensePlate?: string; capacity?: number; status?: string }>(event)
  const schema = Joi.object({
    type: Joi.string().valid('car','van','motorcycle').required(),
    model: Joi.string().allow('').optional(),
    licensePlate: Joi.string().allow('').optional(),
    capacity: Joi.number().min(0).optional(),
    status: Joi.string().valid('available','maintenance','in_delivery').optional(),
  })
  const { error } = schema.validate(body)
  if (error) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  const created = await createVehicle({ type: mapVehicleTypeFrontToDb(body.type as Vehicle["type"]), model: body.model, licensePlate: body.licensePlate, capacity: body.capacity, status: (mapVehicleStatusFrontToDb(body.status as Vehicle['status']) || 'active') as Vehicle['status'] })
  await createLog({ userId: me.id, action: 'vehicle_created', entityType: 'vehicle', entityId: created.id, data: { type: body.type, model: body.model } })
  return toFrontVehicle(created)
})