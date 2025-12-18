import { currentUser } from '~/server/utils/auth'
import { listUserNotifications } from '~/server/repositories/notifications'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const unreadOnly = String(getQuery(event).unread || '').toLowerCase() === 'true'
  const list = await listUserNotifications(me.id, unreadOnly)
  return list
})