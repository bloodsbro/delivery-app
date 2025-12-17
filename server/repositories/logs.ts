import prisma from '~/lib/prisma'

export async function createLog(input: { userId?: string; action: string; entityType?: string; entityId?: string; data?: any; ip?: string; ua?: string }) {
  return prisma.log.create({ data: {
    user_id: input.userId ?? null,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    data: input.data ?? null,
    ip_address: input.ip ?? null,
    user_agent: input.ua ?? null,
  } })
}

export async function listLogs(limit = 100) {
  return prisma.log.findMany({ orderBy: { created_at: 'desc' }, take: limit })
}