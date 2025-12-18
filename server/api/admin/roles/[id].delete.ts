import prisma from '~/lib/prisma'
import { requirePermission } from '~/server/utils/rbac'
import { PERMISSIONS } from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.MANAGE_ROLES)
  const id = event.context.params?.id
  
  // Check if role is in use
  const usage = await prisma.user.count({ where: { role_id: id } })
  if (usage > 0) throw createError({ statusCode: 400, statusMessage: 'Cannot delete role assigned to users' })

  // Check if system role
  const role = await prisma.role.findUnique({ where: { id } })
  if (role && ['admin', 'customer', 'courier'].includes(role.name)) {
      throw createError({ statusCode: 400, statusMessage: 'Cannot delete system roles' })
  }

  await prisma.role.delete({ where: { id } })
  return { ok: true }
})
