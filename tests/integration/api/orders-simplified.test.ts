import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import prisma from '~/lib/prisma'
import { toFrontOrder, mapStatusFrontToDb } from '~/server/utils/orders'
import Joi from 'joi'

describe('Orders API Tests (Simplified)', () => {
  let testRole: any
  let testOrderStatus: any
  let testUser: any
  let testCustomer: any

  beforeAll(async () => {
    testRole = await prisma.role.upsert({
      where: { name: 'test_order_customer' },
      update: {},
      create: {
        name: 'test_order_customer',
        description: 'Test customer role'
      }
    })

    testOrderStatus = await prisma.status.upsert({
      where: { name: 'test_order_pending' },
      update: {},
      create: {
        name: 'test_order_pending',
        type: 'order',
        description: 'Test pending status',
        color: '#FFA500'
      }
    })

    testUser = await prisma.user.create({
      data: {
        email: `test-orders-${Date.now()}@example.com`,
        password_hash: 'hash',
        first_name: 'Order',
        last_name: 'Tester',
        role_id: testRole.id,
        status: 'active'
      }
    })

    testCustomer = await prisma.customer.create({
      data: { user_id: testUser.id }
    })
  })

  afterAll(async () => {
    // Cleanup
    if (testCustomer) {
      const orders = await prisma.order.findMany({ where: { customer_id: testCustomer.id } })
      for (const order of orders) {
        await prisma.notification.deleteMany({ where: { related_entity_id: order.id } })
        await prisma.log.deleteMany({ where: { entity_id: order.id } })
      }
      await prisma.order.deleteMany({ where: { customer_id: testCustomer.id } })
      await prisma.customer.delete({ where: { id: testCustomer.id } }).catch(() => {})
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {})
    }
    if (testOrderStatus) {
      await prisma.status.delete({ where: { id: testOrderStatus.id } }).catch(() => {})
    }
    if (testRole) {
      await prisma.role.delete({ where: { id: testRole.id } }).catch(() => {})
    }
  })

  it('should validate correct order data with Joi', () => {
    const schema = Joi.object({
      customerName: Joi.string().trim().min(2).required(),
      customerAddress: Joi.string().trim().min(3).required(),
      customerPhone: Joi.string().trim().pattern(/^[+]?\d{10,15}$/).required(),
      items: Joi.array().items(
        Joi.object({
          name: Joi.string().trim().min(1).required(),
          quantity: Joi.number().integer().min(1).required(),
          price: Joi.number().min(0).required()
        })
      ).min(1).required()
    })

    const result = schema.validate({
      customerName: 'John Doe',
      customerAddress: '123 Main St',
      customerPhone: '+1234567890',
      items: [{ name: 'Item', quantity: 2, price: 10 }]
    })

    expect(result.error).toBeUndefined()
  })

  it('should create order and normalize data', async () => {
    const order = await prisma.order.create({
      data: {
        order_number: `TTN-TEST-${Date.now()}`,
        customer_id: testCustomer.id,
        status_id: testOrderStatus.id,
        pickup_address: 'Test Pickup',
        delivery_address: 'Test Delivery',
        items: JSON.stringify([{ name: 'Test Item', quantity: 1, price: 10 }]),
        price: 10,
        payment_status: 'pending'
      },
      include: {
        customer: { include: { user: true } },
        status: true
      }
    })

    const normalized = toFrontOrder(order)
    expect(normalized.items).toHaveLength(1)
    expect(normalized.totalAmount).toBe(10)
  })
})
