import { currentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await currentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  return { id: user.id, email: user.email, role: user.role.name, firstName: user.first_name, lastName: user.last_name }
})