import { currentUser } from '~/server/utils/auth'
import prisma from '~/lib/prisma'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me || me.role.name !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const body = await readBody<{ email: string; password: string; firstName?: string; lastName?: string; phone?: string; role?: string }>(event)
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const roleName = String(body.role || 'customer')
  if (!email || !password) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) throw createError({ statusCode: 409, statusMessage: 'User exists' })
  const role = await prisma.role.findFirst({ where: { name: roleName } }) || await prisma.role.create({ data: { name: roleName } })
  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, password_hash: hash, first_name: body.firstName || '', last_name: body.lastName || '', phone: body.phone || '', role_id: role.id, status: 'active' } })
  return { id: user.id, email: user.email, role: role.name }
})