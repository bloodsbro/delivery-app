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
  const revenueByDay: { date: string; sum: number }[] = []
  let totalRevenue = 0
  let totalOrders = 0

  for (let i = 0; i < days; i++) {
    const dayStart = new Date(start)
    dayStart.setDate(start.getDate() + i)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayStart.getDate() + 1)
    
    const count = await prisma.order.count({ where: { created_at: { gte: dayStart, lt: dayEnd } } })
    const revenueAgg = await prisma.order.aggregate({ 
      where: { created_at: { gte: dayStart, lt: dayEnd } },
      _sum: { price: true }
    })
    const revenue = Number(revenueAgg._sum.price || 0)

    ordersByDay.push({ date: dayStart.toISOString().slice(0,10), count })
    revenueByDay.push({ date: dayStart.toISOString().slice(0,10), sum: revenue })
    
    totalRevenue += revenue
    totalOrders += count
  }

  const vehiclesByStatusRaw = await prisma.vehicle.groupBy({ by: ['status'], _count: { status: true } })
  const vehiclesByStatus = vehiclesByStatusRaw.map(r => ({ status: r.status, count: r._count.status }))

  const activeCouriersCount = await prisma.courier.count({
    where: { availability: { in: ['available', 'busy'] } }
  })

  const activeVehiclesCount = await prisma.vehicle.count({
    where: { status: 'active' }
  })
  
  // Top 5 couriers by completed deliveries in the period
  // Prisma doesn't support complex relation counting in groupBy easily, so we might need a raw query or a different approach.
  // For simplicity and safety with Prisma Accelerate limitations, let's fetch couriers and their delivery counts manually or use aggregate if possible.
  // Actually, we can group Delivery by courier_id.
  const deliveriesRaw = await prisma.delivery.groupBy({
    by: ['courier_id'],
    where: {
      created_at: { gte: start },
      status: { name: 'delivered' } // Assuming 'delivered' is the status name, but status is a relation.
    },
    _count: { id: true },
    orderBy: {
      _count: { id: 'desc' }
    },
    take: 5
  })
  
  // Wait, filtering by status name in groupBy is not directly supported if status is a relation ID. 
  // We need the ID for 'delivered' status.
  const deliveredStatus = await prisma.status.findFirst({ where: { name: 'delivered', type: 'delivery' } })
  
  let topCouriers: { name: string; count: number }[] = []
  if (deliveredStatus) {
    const topDeliveries = await prisma.delivery.groupBy({
      by: ['courier_id'],
      where: {
        created_at: { gte: start },
        status_id: deliveredStatus.id
      },
      _count: { id: true },
      orderBy: {
        _count: { id: 'desc' }
      },
      take: 5
    })

    const courierIds = topDeliveries.map(d => d.courier_id)
    const couriers = await prisma.courier.findMany({
      where: { id: { in: courierIds } },
      include: { user: true }
    })
    
    topCouriers = topDeliveries.map(d => {
      const c = couriers.find(courier => courier.id === d.courier_id)
      return {
        name: c ? `${c.user.first_name} ${c.user.last_name}` : 'Unknown',
        count: d._count.id
      }
    })
  }

  return { 
    ordersByStatus, 
    ordersByDay, 
    revenueByDay, 
    vehiclesByStatus,
    stats: {
      totalRevenue,
      totalOrders,
      activeCouriersCount,
      activeVehiclesCount,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    },
    topCouriers
  }
})