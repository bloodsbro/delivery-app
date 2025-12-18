import prisma from '~/lib/prisma'
import { requirePermission } from '~/server/utils/rbac'
import { PERMISSIONS } from '~/utils/permissions'
import Joi from 'joi'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.MANAGE_ROLES)
  const id = event.context.params?.id
  const body = await readBody(event)

  const schema = Joi.object({
    name: Joi.string().trim().optional(),
    description: Joi.string().allow('').optional(),
    permissions: Joi.array().items(Joi.string()).optional()
  })

  const { error, value } = schema.validate(body)
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })

  if (value.name) {
    const exists = await prisma.role.findFirst({ where: { name: value.name, NOT: { id } } })
    if (exists) throw createError({ statusCode: 409, statusMessage: 'Role name taken' })
  }

  const role = await prisma.role.update({
    where: { id },
    data: {
      name: value.name,
      description: value.description,
      permissions: value.permissions
    }
  })
  return role
})
