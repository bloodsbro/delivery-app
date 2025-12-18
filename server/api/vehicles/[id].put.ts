import { toFrontVehicle, mapVehicleTypeFrontToDb, mapVehicleStatusFrontToDb } from '~/server/utils/vehicles'
import { requirePermission } from '~/server/utils/rbac'
import { PERMISSIONS } from '~/utils/permissions'
import { updateVehicle } from '~/server/repositories/vehicles'
import Joi from 'joi'
import { createLog } from '~/server/repositories/logs'
import type { Vehicle } from '~/types/vehicle'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  const me = await requirePermission(event, PERMISSIONS.MANAGE_VEHICLES)
  const body = await readBody<{ type?: string; model?: string; licensePlate?: string; capacity?: number; status?: string }>(event)
  const schema = Joi.object({
    type: Joi.string().valid('car','van','motorcycle','truck','bicycle','scooter').optional(),
    model: Joi.string().allow('').optional(),
    licensePlate: Joi.string().allow('').optional(),
    capacity: Joi.number().min(0).optional(),
    status: Joi.string().valid('available','maintenance','in_delivery','offline','busy').optional(),
  })
  const { error } = schema.validate(body)
  if (error) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  const updated = await updateVehicle(id, { type: (mapVehicleTypeFrontToDb(body.type as Vehicle["type"])) ?? undefined, model: body.model ?? undefined, licensePlate: body.licensePlate ?? undefined, capacity: body.capacity ?? undefined, status: (mapVehicleStatusFrontToDb(body.status as Vehicle['status'])) ?? undefined })
  await createLog({ userId: me.id, action: 'vehicle_updated', entityType: 'vehicle', entityId: id, data: { ...body } })
  return toFrontVehicle(updated)
})