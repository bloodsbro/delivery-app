import prisma from '~/lib/prisma'
import { requirePermission } from '~/server/utils/rbac'
import { PERMISSIONS } from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.MANAGE_ROLES)
  return await prisma.role.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { users: true } } } })
})
