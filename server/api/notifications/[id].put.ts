import { currentUser } from '~/server/utils/auth'
import { markNotificationRead } from '~/server/repositories/notifications'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  const me = await currentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  await markNotificationRead(id, me.id)
  return { ok: true }
})