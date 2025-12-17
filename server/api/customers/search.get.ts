import { currentUser } from '~/server/utils/auth'
import { searchCustomersByPhone } from '~/server/repositories/customers'
import Joi from 'joi'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const q = (getQuery(event).q as string)?.trim()
  const schema = Joi.object({ q: Joi.string().min(3).required() })
  const { error } = schema.validate({ q })
  if (error) return []
  return await searchCustomersByPhone(q!)
})