import prisma from '~/lib/prisma'
import bcrypt from 'bcrypt'
import { setSession } from '~/server/utils/auth'
import Joi from 'joi'
import { createLog } from '~/server/repositories/logs'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string; captchaToken?: string }>(event)
  const schema = Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().min(6).required(),
    captchaToken: Joi.string().optional(),
  })
  const { error } = schema.validate(body)
  if (error) throw createError({ statusCode: 400, statusMessage: 'Invalid credentials' })
  
  // Verify CAPTCHA
  const config = useRuntimeConfig()
  const secretKey = config.recaptchaSecretKey

  if (secretKey) {
    if (!body.captchaToken) {
      throw createError({ statusCode: 400, statusMessage: 'Будь ласка, пройдіть перевірку CAPTCHA' })
    }

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${body.captchaToken}`
    try {
      const verifyRes = await fetch(verifyUrl, { method: 'POST' })
      const verifyData = await verifyRes.json()
      if (!verifyData.success) {
        throw createError({ statusCode: 400, statusMessage: 'CAPTCHA перевірка не пройдена. Спробуйте ще раз.' })
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e.statusCode === 400 && e.statusMessage) throw e
      console.error('CAPTCHA error:', e)
      throw createError({ statusCode: 500, statusMessage: 'Помилка перевірки CAPTCHA' })
    }
  }

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