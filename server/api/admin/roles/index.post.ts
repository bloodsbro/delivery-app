import prisma from '~/lib/prisma'
import { requirePermission } from '~/server/utils/rbac'
import { PERMISSIONS } from '~/utils/permissions'
import Joi from 'joi'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.MANAGE_ROLES)
  const body = await readBody(event)
  
  const schema = Joi.object({
    name: Joi.string().trim().required(),
    description: Joi.string().allow('').optional(),
    permissions: Joi.array().items(Joi.string()).default([])
  })

  const { error, value } = schema.validate(body)
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })

  const exists = await prisma.role.findUnique({ where: { name: value.name } })
  if (exists) throw createError({ statusCode: 409, statusMessage: 'Role already exists' })

  const role = await prisma.role.create({
    data: {
      name: value.name,
      description: value.description,
      permissions: value.permissions
    }
  })
  return role
})
