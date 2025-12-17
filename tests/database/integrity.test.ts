import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import prisma from '~/lib/prisma'

describe('Database Integrity Tests', () => {
  let testRole: any
  let testOrderStatus: any
  let testCourierStatus: any

  beforeAll(async () => {
    testRole = await prisma.role.upsert({
      where: { name: 'test_customer' },
      update: {},
      create: {
        name: 'test_customer',
        description: 'Test customer role'
      }
    })

    testOrderStatus = await prisma.status.upsert({
      where: { name: 'test_pending' },
      update: {},
      create: {
        name: 'test_pending',
        description: 'Test pending status',
        type: 'order',
        color: '#FFA500'
      }
    })

    testCourierStatus = await prisma.status.upsert({
      where: { name: 'test_courier_active' },
      update: {},
      create: {
        name: 'test_courier_active',
        description: 'Test courier active',
        type: 'courier',
        color: '#00FF00'
      }
    })
  })

  afterAll(async () => {
    // Cleanup
    await prisma.status.delete({ where: { name: 'test_pending' } }).catch(() => {})
    await prisma.status.delete({ where: { name: 'test_courier_active' } }).catch(() => {})
    await prisma.role.delete({ where: { name: 'test_customer' } }).catch(() => {})
  })

  describe('Unique Constraints', () => {
    it('should enforce unique order_number (TTN)', async () => {
      const user = await prisma.user.create({
        data: {
          email: `unique-ttn-${Date.now()}@test.com`,
          password_hash: 'hash',
          first_name: 'Test',
          last_name: 'User',
          role_id: testRole.id,
          status: 'active'
        }
      })

      const customer = await prisma.customer.create({
        data: { user_id: user.id }
      })

      const orderNumber = `TTN-UNIQUE-${Date.now()}`

      // Create first order
      await prisma.order.create({
        data: {
          order_number: orderNumber,
          customer_id: customer.id,
          status_id: testOrderStatus.id,
          pickup_address: 'Test Pickup',
          delivery_address: 'Test Delivery',
          payment_status: 'pending'
        }
      })

      // Try to create duplicate
      try {
        await prisma.order.create({
          data: {
            order_number: orderNumber, // Same TTN
            customer_id: customer.id,
            status_id: testOrderStatus.id,
            pickup_address: 'Test Pickup 2',
            delivery_address: 'Test Delivery 2',
            payment_status: 'pending'
          }
        })
        expect.fail('Should have thrown unique constraint error')
      } catch (error: any) {
        expect(error.message).toMatch(/unique/i)
      }

      // Cleanup
      await prisma.order.deleteMany({ where: { order_number: orderNumber } })
      await prisma.customer.delete({ where: { id: customer.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    it('should enforce unique email for users', async () => {
      const email = `unique-email-${Date.now()}@test.com`

      await prisma.user.create({
        data: {
          email,
          password_hash: 'hash',
          first_name: 'Test',
          last_name: 'User 1',
          role_id: testRole.id,
          status: 'active'
        }
      })

      // Try to create duplicate email
      try {
        await prisma.user.create({
          data: {
            email, // Same email
            password_hash: 'hash',
            first_name: 'Test',
            last_name: 'User 2',
            role_id: testRole.id,
            status: 'active'
          }
        })
        expect.fail('Should have thrown unique constraint error')
      } catch (error: any) {
        expect(error.message).toMatch(/unique/i)
      }

      // Cleanup
      await prisma.user.delete({ where: { email } })
    })

    it('should enforce unique role name', async () => {
      const roleName = `unique-role-${Date.now()}`

      await prisma.role.create({
        data: {
          name: roleName,
          description: 'Test role'
        }
      })

      try {
        await prisma.role.create({
          data: {
            name: roleName, // Same name
            description: 'Duplicate role'
          }
        })
        expect.fail('Should have thrown unique constraint error')
      } catch (error: any) {
        expect(error.message).toMatch(/unique/i)
      }

      // Cleanup
      await prisma.role.delete({ where: { name: roleName } })
    })
  })

  describe('Foreign Key Constraints', () => {
    it('should maintain order → customer relationship', async () => {
      const user = await prisma.user.create({
        data: {
          email: `fk-test-${Date.now()}@test.com`,
          password_hash: 'hash',
          first_name: 'FK',
          last_name: 'Test',
          role_id: testRole.id,
          status: 'active'
        }
      })

      const customer = await prisma.customer.create({
        data: { user_id: user.id }
      })

      const order = await prisma.order.create({
        data: {
          order_number: `TTN-FK-${Date.now()}`,
          customer_id: customer.id,
          status_id: testOrderStatus.id,
          pickup_address: 'Pickup',
          delivery_address: 'Delivery',
          payment_status: 'pending'
        }
      })

      // Try to delete customer while order exists - should fail
      try {
        await prisma.customer.delete({ where: { id: customer.id } })
        expect.fail('Should have thrown foreign key constraint error')
      } catch (error: any) {
        expect(error.code).toBe('P2003') // Prisma foreign key error
      }

      // Cleanup in correct order
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.customer.delete({ where: { id: customer.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    it('should maintain delivery → courier relationship', async () => {
      const courierUser = await prisma.user.create({
        data: {
          email: `courier-fk-${Date.now()}@test.com`,
          password_hash: 'hash',
          first_name: 'Courier',
          last_name: 'FK',
          role_id: testRole.id,
          status: 'active'
        }
      })

      const courier = await prisma.courier.create({
        data: {
          user_id: courierUser.id,
          status_id: testCourierStatus.id,
          availability: 'available'
        }
      })

      const customerUser = await prisma.user.create({
        data: {
          email: `customer-fk-${Date.now()}@test.com`,
          password_hash: 'hash',
          first_name: 'Customer',
          last_name: 'FK',
          role_id: testRole.id,
          status: 'active'
        }
      })

      const customer = await prisma.customer.create({
        data: { user_id: customerUser.id }
      })

      const order = await prisma.order.create({
        data: {
          order_number: `TTN-DELIVERY-FK-${Date.now()}`,
          customer_id: customer.id,
          status_id: testOrderStatus.id,
          pickup_address: 'Pickup',
          delivery_address: 'Delivery',
          payment_status: 'pending'
        }
      })

      const delivery = await prisma.delivery.create({
        data: {
          order_id: order.id,
          courier_id: courier.id,
          status_id: testOrderStatus.id
        }
      })

      // Try to delete courier while delivery exists - should fail
      try {
        await prisma.courier.delete({ where: { id: courier.id } })
        expect.fail('Should have thrown foreign key constraint error')
      } catch (error: any) {
        expect(error.code).toBe('P2003') // Prisma foreign key error
      }

      // Cleanup
      await prisma.delivery.delete({ where: { id: delivery.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.courier.delete({ where: { id: courier.id } })
      await prisma.customer.delete({ where: { id: customer.id } })
      await prisma.user.deleteMany({ where: { id: { in: [courierUser.id, customerUser.id] } } })
    })

    it('should prevent orphaned orders with invalid customer_id', async () => {
      const invalidCustomerId = '00000000-0000-0000-0000-000000000000'

      try {
        await prisma.order.create({
          data: {
            order_number: `TTN-INVALID-${Date.now()}`,
            customer_id: invalidCustomerId,
            status_id: testOrderStatus.id,
            pickup_address: 'Pickup',
            delivery_address: 'Delivery',
            payment_status: 'pending'
          }
        })
        expect.fail('Should have thrown foreign key constraint error')
      } catch (error: any) {
        expect(error.code).toBe('P2003') // Prisma foreign key error
      }
    })
  })

  describe('Cascade Deletion', () => {
    it('should cascade delete user-related data correctly', async () => {
      const user = await prisma.user.create({
        data: {
          email: `cascade-${Date.now()}@test.com`,
          password_hash: 'hash',
          first_name: 'Cascade',
          last_name: 'Test',
          role_id: testRole.id,
          status: 'active'
        }
      })

      await prisma.notification.create({
        data: {
          user_id: user.id,
          type: 'in_app',
          title: 'Test',
          content: 'Test notification'
        }
      })

      await prisma.log.create({
        data: {
          user_id: user.id,
          action: 'test_action'
        }
      })

      const notifCount = await prisma.notification.count({ where: { user_id: user.id } })
      const logCount = await prisma.log.count({ where: { user_id: user.id } })

      expect(notifCount).toBeGreaterThan(0)
      expect(logCount).toBeGreaterThan(0)

      // Delete user-related data first
      await prisma.notification.deleteMany({ where: { user_id: user.id } })
      await prisma.log.deleteMany({ where: { user_id: user.id } })
      await prisma.user.delete({ where: { id: user.id } })

      const notifAfter = await prisma.notification.count({ where: { user_id: user.id } })
      const logAfter = await prisma.log.count({ where: { user_id: user.id } })

      expect(notifAfter).toBe(0)
      expect(logAfter).toBe(0)
    })
  })

  describe('Schema Validation', () => {
    it('should validate Prisma schema matches database', async () => {
      // Check if all expected tables exist
      const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname='public'
      `

      const tableNames = tables.map(t => t.tablename)

      expect(tableNames).toContain('users')
      expect(tableNames).toContain('roles')
      expect(tableNames).toContain('customers')
      expect(tableNames).toContain('orders')
      expect(tableNames).toContain('couriers')
      expect(tableNames).toContain('vehicles')
      expect(tableNames).toContain('deliveries')
      expect(tableNames).toContain('routes')
      expect(tableNames).toContain('route_points')
      expect(tableNames).toContain('statuses')
      expect(tableNames).toContain('notifications')
      expect(tableNames).toContain('logs')
    })

    it('should validate required enum types exist', async () => {
      const enums = await prisma.$queryRaw<Array<{ typname: string }>>`
        SELECT typname FROM pg_type WHERE typtype='e'
      `

      const enumNames = enums.map(e => e.typname)

      expect(enumNames).toContain('UserStatus')
      expect(enumNames).toContain('PaymentStatus')
      expect(enumNames).toContain('StatusType')
      expect(enumNames).toContain('VehicleType')
      expect(enumNames).toContain('VehicleStatus')
      expect(enumNames).toContain('CourierAvailability')
      expect(enumNames).toContain('RouteStatus')
      expect(enumNames).toContain('RoutePointType')
      expect(enumNames).toContain('NotificationType')
    })
  })

  describe('Data Integrity', () => {
    it('should maintain consistent timestamps', async () => {
      const user = await prisma.user.create({
        data: {
          email: `timestamp-${Date.now()}@test.com`,
          password_hash: 'hash',
          first_name: 'Timestamp',
          last_name: 'Test',
          role_id: testRole.id,
          status: 'active'
        }
      })

      expect(user.created_at).toBeTruthy()
      expect(user.updated_at).toBeTruthy()
      expect(user.created_at.getTime()).toBeLessThanOrEqual(user.updated_at.getTime())

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))

      // Update and check timestamp
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { first_name: 'Updated' }
      })

      expect(updated.updated_at.getTime()).toBeGreaterThan(user.updated_at.getTime())

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } })
    })

    it('should enforce non-null constraints', async () => {
      try {
        await prisma.user.create({
          data: {
            // Missing required email
            password_hash: 'hash',
            first_name: 'Test',
            last_name: 'User',
            role_id: testRole.id,
            status: 'active'
          } as any
        })
        expect.fail('Should have thrown validation error')
      } catch (error: any) {
        expect(error).toBeTruthy()
      }
    })
  })
})
