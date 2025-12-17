import { describe, it, expect } from 'vitest'
import { mapStatusDbToFront, mapStatusFrontToDb, toFrontOrder } from '~/server/utils/orders'

describe('mapStatusDbToFront', () => {
  it('should map pending to pending', () => {
    expect(mapStatusDbToFront('pending')).toBe('pending')
  })

  it('should map confirmed to processing', () => {
    expect(mapStatusDbToFront('confirmed')).toBe('processing')
  })

  it('should map assigned to processing', () => {
    expect(mapStatusDbToFront('assigned')).toBe('processing')
  })

  it('should map picked_up to shipped', () => {
    expect(mapStatusDbToFront('picked_up')).toBe('shipped')
  })

  it('should map in_transit to shipped', () => {
    expect(mapStatusDbToFront('in_transit')).toBe('shipped')
  })

  it('should map delivered to delivered', () => {
    expect(mapStatusDbToFront('delivered')).toBe('delivered')
  })

  it('should map cancelled to cancelled', () => {
    expect(mapStatusDbToFront('cancelled')).toBe('cancelled')
  })

  it('should map unknown status to processing', () => {
    expect(mapStatusDbToFront('unknown')).toBe('processing')
    expect(mapStatusDbToFront('')).toBe('processing')
  })
})

describe('mapStatusFrontToDb', () => {
  it('should map pending to pending', () => {
    expect(mapStatusFrontToDb('pending')).toBe('pending')
  })

  it('should map processing to confirmed', () => {
    expect(mapStatusFrontToDb('processing')).toBe('confirmed')
  })

  it('should map shipped to in_transit', () => {
    expect(mapStatusFrontToDb('shipped')).toBe('in_transit')
  })

  it('should map delivered to delivered', () => {
    expect(mapStatusFrontToDb('delivered')).toBe('delivered')
  })

  it('should map cancelled to cancelled', () => {
    expect(mapStatusFrontToDb('cancelled')).toBe('cancelled')
  })

  it('should map unknown status to confirmed', () => {
    // @ts-expect-error testing unknown value
    expect(mapStatusFrontToDb('unknown')).toBe('confirmed')
  })
})

describe('toFrontOrder', () => {
  it('should parse valid items from JSON string', () => {
    const db = {
      id: 'order-123',
      order_number: 'ORD-001',
      delivery_address: '123 Main St',
      items: JSON.stringify([
        { name: 'Product A', quantity: 2, price: 10.5 },
        { name: 'Product B', quantity: 1, price: 25 }
      ]),
      price: 46,
      created_at: '2024-01-01T00:00:00Z',
      status: { name: 'confirmed' }
    }

    const result = toFrontOrder(db)

    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual({ name: 'Product A', quantity: 2, price: 10.5 })
    expect(result.items[1]).toEqual({ name: 'Product B', quantity: 1, price: 25 })
  })

  it('should parse items from JSON object', () => {
    const db = {
      id: 'order-123',
      order_number: 'ORD-001',
      delivery_address: '123 Main St',
      items: [{ name: 'Item', quantity: 1, price: 10 }],
      created_at: '2024-01-01T00:00:00Z',
      status: { name: 'pending' }
    }

    const result = toFrontOrder(db)

    expect(result.items).toHaveLength(1)
    expect(result.items[0].name).toBe('Item')
  })

  it('should handle invalid JSON items gracefully', () => {
    const db = {
      id: 'order-123',
      order_number: 'ORD-001',
      delivery_address: '123 Main St',
      items: 'invalid-json',
      created_at: '2024-01-01T00:00:00Z',
      status: { name: 'pending' }
    }

    const result = toFrontOrder(db)

    expect(result.items).toEqual([])
  })

  it('should handle null items', () => {
    const db = {
      id: 'order-123',
      order_number: 'ORD-001',
      delivery_address: '123 Main St',
      items: null,
      created_at: '2024-01-01T00:00:00Z',
      status: { name: 'pending' }
    }

    const result = toFrontOrder(db)

    expect(result.items).toEqual([])
  })

  it('should calculate totalAmount from price if provided', () => {
    const db = {
      id: 'order-123',
      order_number: 'ORD-001',
      delivery_address: '123 Main St',
      items: [{ name: 'Item', quantity: 2, price: 10 }],
      price: 50,
      created_at: '2024-01-01T00:00:00Z',
      status: { name: 'pending' }
    }

    const result = toFrontOrder(db)

    expect(result.totalAmount).toBe(50)
  })

  it('should calculate totalAmount from items if price is null', () => {
    const db = {
      id: 'order-123',
      order_number: 'ORD-001',
      delivery_address: '123 Main St',
      items: [
        { name: 'Item A', quantity: 2, price: 10 },
        { name: 'Item B', quantity: 3, price: 5 }
      ],
      price: null,
      created_at: '2024-01-01T00:00:00Z',
      status: { name: 'pending' }
    }

    const result = toFrontOrder(db)

    expect(result.totalAmount).toBe(35) // 2*10 + 3*5
  })

  it('should extract customer name from nested user object', () => {
    const db = {
      id: 'order-123',
      order_number: 'ORD-001',
      delivery_address: '123 Main St',
      items: [],
      created_at: '2024-01-01T00:00:00Z',
      status: { name: 'pending' },
      customer: {
        user: {
          first_name: 'John',
          last_name: 'Doe',
          phone: '+1234567890'
        }
      }
    }

    const result = toFrontOrder(db)

    expect(result.customerName).toBe('John Doe')
    expect(result.customerPhone).toBe('+1234567890')
  })

  it('should fallback to delivery contact name if customer is missing', () => {
    const db = {
      id: 'order-123',
      order_number: 'ORD-001',
      delivery_address: '123 Main St',
      delivery_contact_name: 'Jane Smith',
      delivery_contact_phone: '+9876543210',
      items: [],
      created_at: '2024-01-01T00:00:00Z',
      status: { name: 'pending' }
    }

    const result = toFrontOrder(db)

    expect(result.customerName).toBe('Jane Smith')
    expect(result.customerPhone).toBe('+9876543210')
  })

  it('should parse coordinates correctly', () => {
    const db = {
      id: 'order-123',
      order_number: 'ORD-001',
      delivery_address: '123 Main St',
      delivery_latitude: 40.7128,
      delivery_longitude: -74.0060,
      items: [],
      created_at: '2024-01-01T00:00:00Z',
      status: { name: 'pending' }
    }

    const result = toFrontOrder(db)

    expect(result.deliveryLat).toBe(40.7128)
    expect(result.deliveryLng).toBe(-74.0060)
  })

  it('should handle missing coordinates', () => {
    const db = {
      id: 'order-123',
      order_number: 'ORD-001',
      delivery_address: '123 Main St',
      items: [],
      created_at: '2024-01-01T00:00:00Z',
      status: { name: 'pending' }
    }

    const result = toFrontOrder(db)

    expect(result.deliveryLat).toBeUndefined()
    expect(result.deliveryLng).toBeUndefined()
  })

  it('should extract courier information if available', () => {
    const db = {
      id: 'order-123',
      order_number: 'ORD-001',
      delivery_address: '123 Main St',
      items: [],
      created_at: '2024-01-01T00:00:00Z',
      status: { name: 'in_transit' },
      delivery: {
        courier: {
          id: 'courier-456',
          user: {
            first_name: 'Mike',
            last_name: 'Wilson'
          }
        }
      }
    }

    const result = toFrontOrder(db)

    expect(result.courierId).toBe('courier-456')
    expect(result.courierName).toBe('Mike Wilson')
  })

  it('should handle missing courier gracefully', () => {
    const db = {
      id: 'order-123',
      order_number: 'ORD-001',
      delivery_address: '123 Main St',
      items: [],
      created_at: '2024-01-01T00:00:00Z',
      status: { name: 'pending' }
    }

    const result = toFrontOrder(db)

    expect(result.courierId).toBeUndefined()
    expect(result.courierName).toBeUndefined()
  })

  it('should convert all required fields to strings/numbers', () => {
    const db = {
      id: 'order-123',
      order_number: 'ORD-001',
      delivery_address: '123 Main St',
      items: [],
      created_at: '2024-01-01T00:00:00Z',
      status: { name: 'pending' }
    }

    const result = toFrontOrder(db)

    expect(typeof result.id).toBe('string')
    expect(typeof result.trackingNumber).toBe('string')
    expect(typeof result.customerAddress).toBe('string')
    expect(typeof result.totalAmount).toBe('number')
    expect(typeof result.createdAt).toBe('string')
  })

  it('should sanitize missing item fields', () => {
    const db = {
      id: 'order-123',
      order_number: 'ORD-001',
      delivery_address: '123 Main St',
      items: [
        { name: null, quantity: null, price: null },
        { name: 'Valid Item' }
      ],
      created_at: '2024-01-01T00:00:00Z',
      status: { name: 'pending' }
    }

    const result = toFrontOrder(db)

    expect(result.items[0]).toEqual({ name: 'Товар', quantity: 1, price: 0 })
    expect(result.items[1]).toEqual({ name: 'Valid Item', quantity: 1, price: 0 })
  })
})
