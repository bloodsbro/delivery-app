import prisma from '~/lib/prisma'

export async function findOrCreateCustomerByPhone(name: string, phone: string, address?: string) {
  const existingUser = await prisma.user.findFirst({ where: { phone } })
  let customer = existingUser ? await prisma.customer.findFirst({ where: { user_id: existingUser.id }, select: { id: true } }) : null
  if (!customer) {
    const role = await prisma.role.findFirst({ where: { name: 'customer' } })
    const roleId = role?.id ?? (await prisma.role.create({ data: { name: 'customer' } })).id
    const firstName = (name || '').split(' ')[0] || name
    const lastName = (name || '').split(' ').slice(1).join(' ')
    const user = existingUser ?? await prisma.user.create({ data: { email: `customer${Date.now()}@example.com`, password_hash: '', first_name: firstName, last_name: lastName, phone, role_id: roleId, status: 'active' } })
    customer = await prisma.customer.create({ data: { user_id: user.id, address: address || null } })
  }
  return customer.id
}

export async function searchCustomersByPhone(q: string) {
  const users = await prisma.user.findMany({ where: { phone: { contains: q } }, take: 10 })
  const customers = await prisma.customer.findMany({ where: { user_id: { in: users.map(u => u.id) } } })
  const addrByUser: Record<string,string|undefined> = {}
  customers.forEach(c => { addrByUser[c.user_id] = (c as any).address || undefined })
  return users.map(u => ({ id: u.id, phone: u.phone, firstName: u.first_name, lastName: u.last_name, address: addrByUser[u.id] }))
}