import prisma from '~/lib/prisma'
import { currentUser } from '~/server/utils/auth'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const body = await readBody<{ firstName?: string; lastName?: string; phone?: string; password?: string }>(event)
  const data: any = {}
  if (body.firstName != null) data.first_name = body.firstName
  if (body.lastName != null) data.last_name = body.lastName
  if (body.phone != null) data.phone = body.phone
  if (body.password) data.password_hash = await bcrypt.hash(body.password, 10)
  await prisma.user.update({ where: { id: me.id }, data })
  return { ok: true }
})