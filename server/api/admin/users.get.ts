import prisma from '~/lib/prisma'
import { requirePermission } from '~/server/utils/rbac'
import { PERMISSIONS } from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.MANAGE_USERS)

  const users = await prisma.user.findMany({ include: { role: true }, orderBy: { created_at: 'desc' } })
  
  return users.map(u => ({ id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name, phone: u.phone, permissions: u.role.permissions, role: u.role, created_at: u.created_at, first_name: u.first_name, last_name: u.last_name }))
})