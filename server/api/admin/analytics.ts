import { currentUser } from '~/server/utils/auth'
import prisma from '~/lib/prisma'

export default defineEventHandler(async (event) => {
  const me = await currentUser(event)
  if (!me || me.role.name !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const now = new Date()
  const days = Number(getQuery(event).days || 14)
  const start = new Date(now)
  start.setHours(0,0,0,0)
  start.setDate(start.getDate() - (days - 1))

  const ordersByStatusRaw = await prisma.order.groupBy({ by: ['status_id'], _count: { status_id: true } })
  const statusIds = ordersByStatusRaw.map(r => r.status_id)
  const statuses = await prisma.status.findMany({ where: { id: { in: statusIds }, type: 'order' } })
  const statusMap = Object.fromEntries(statuses.map(s => [s.id, s.name]))
  const ordersByStatus = ordersByStatusRaw.map(r => ({ status: statusMap[r.status_id] || r.status_id, count: r._count.status_id }))

  const ordersByDay: { date: string; count: number }[] = []
  for (let i = 0; i < days; i++) {
    const dayStart = new Date(start)
    dayStart.setDate(start.getDate() + i)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayStart.getDate() + 1)
    const count = await prisma.order.count({ where: { created_at: { gte: dayStart, lt: dayEnd } } })
    ordersByDay.push({ date: dayStart.toISOString().slice(0,10), count })
  }

  const vehiclesByStatusRaw = await prisma.vehicle.groupBy({ by: ['status'], _count: { status: true } })
  const vehiclesByStatus = vehiclesByStatusRaw.map(r => ({ status: r.status, count: r._count.status }))

  return { ordersByStatus, ordersByDay, vehiclesByStatus }
})