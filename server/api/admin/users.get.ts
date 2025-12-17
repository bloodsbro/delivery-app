import { currentUser } from '~/server/utils/auth'
import prisma from '~/lib/prisma'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me || me.role.name !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const users = await prisma.user.findMany({ include: { role: true }, orderBy: { created_at: 'desc' } })
  return users.map(u => ({ id: u.id, email: u.email, role: u.role.name, firstName: u.first_name, lastName: u.last_name, phone: u.phone }))
})