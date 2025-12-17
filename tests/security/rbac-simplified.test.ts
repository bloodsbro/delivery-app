import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import prisma from '~/lib/prisma'
import bcrypt from 'bcrypt'

describe('RBAC Tests (Simplified)', () => {
  let adminRole: any, courierRole: any
  let adminUser: any, courierUser: any

  beforeAll(async () => {
    adminRole = await prisma.role.upsert({
      where: { name: 'test_rbac_admin' },
      update: {},
      create: { name: 'test_rbac_admin', description: 'Test admin' }
    })

    courierRole = await prisma.role.upsert({
      where: { name: 'test_rbac_courier' },
      update: {},
      create: { name: 'test_rbac_courier', description: 'Test courier' }
    })

    const hash = await bcrypt.hash('test123', 10)

    adminUser = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        password_hash: hash,
        first_name: 'Admin',
        last_name: 'Test',
        role_id: adminRole.id,
        status: 'active'
      }
    })

    courierUser = await prisma.user.create({
      data: {
        email: `courier-${Date.now()}@test.com`,
        password_hash: hash,
        first_name: 'Courier',
        last_name: 'Test',
        role_id: courierRole.id,
        status: 'active'
      }
    })
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, courierUser.id] } } })
    await prisma.role.deleteMany({ where: { id: { in: [adminRole.id, courierRole.id] } } })
  })

  it('should assign roles correctly', async () => {
    const admin = await prisma.user.findUnique({
      where: { id: adminUser.id },
      include: { role: true }
    })

    const courier = await prisma.user.findUnique({
      where: { id: courierUser.id },
      include: { role: true }
    })

    expect(admin?.role.name).toBe('test_rbac_admin')
    expect(courier?.role.name).toBe('test_rbac_courier')
  })

  it('should authorize based on role', async () => {
    const admin = await prisma.user.findUnique({
      where: { id: adminUser.id },
      include: { role: true }
    })

    const isAdmin = admin?.role.name?.includes('admin')
    expect(isAdmin).toBe(true)
  })
})
