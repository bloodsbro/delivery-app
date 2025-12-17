import prisma from '~/lib/prisma'

export async function createNotification(input: { userId: string; type: 'email' | 'sms' | 'push' | 'in_app'; title: string; content: string; relatedEntityType?: string; relatedEntityId?: string; sentAt?: Date }) {
  return prisma.notification.create({ data: {
    user_id: input.userId,
    type: input.type as any,
    title: input.title,
    content: input.content,
    related_entity_type: input.relatedEntityType ?? null,
    related_entity_id: input.relatedEntityId ?? null,
    sent_at: input.sentAt ?? null,
  } })
}

export async function markNotificationRead(id: string, userId: string) {
  const n = await prisma.notification.findUnique({ where: { id } })
  if (!n || n.user_id !== userId) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  return prisma.notification.update({ where: { id }, data: { is_read: true, read_at: new Date() } })
}

export async function listUserNotifications(userId: string, unreadOnly?: boolean) {
  return prisma.notification.findMany({ where: { user_id: userId, ...(unreadOnly ? { is_read: false } : {}) }, orderBy: { created_at: 'desc' } })
}