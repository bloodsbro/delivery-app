import prisma from '~/lib/prisma'
import bcrypt from 'bcrypt'
import { setSession } from '~/server/utils/auth'
import Joi from 'joi'
import { createLog } from '~/server/repositories/logs'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const schema = Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().min(6).required(),
  })
  const { error } = schema.validate(body)
  if (error) throw createError({ statusCode: 400, statusMessage: 'Invalid credentials' })
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  if (!email || !password) throw createError({ statusCode: 400, statusMessage: 'Invalid credentials' })
  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } })
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  setSession(event, user.id)
  await createLog({ userId: user.id, action: 'login', entityType: 'user', entityId: user.id, ip: (getRequestHeaders(event)['x-forwarded-for'] as string) || undefined, ua: getRequestHeaders(event)['user-agent'] as string })
  return { id: user.id, email: user.email, role: user.role.name, firstName: user.first_name, lastName: user.last_name }
})