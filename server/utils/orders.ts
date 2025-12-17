import type { Order } from '~/types/order'

export function mapStatusDbToFront(name: string): Order['status'] {
  switch (name) {
    case 'pending': return 'pending'
    case 'confirmed': return 'processing'
    case 'assigned': return 'processing'
    case 'picked_up': return 'shipped'
    case 'in_transit': return 'shipped'
    case 'delivered': return 'delivered'
    case 'cancelled': return 'cancelled'
    default: return 'processing'
  }
}

export function mapStatusFrontToDb(status: Order['status']): string {
  switch (status) {
    case 'pending': return 'pending'
    case 'processing': return 'confirmed'
    case 'shipped': return 'in_transit'
    case 'delivered': return 'delivered'
    case 'cancelled': return 'cancelled'
    default: return 'confirmed'
  }
}

export function toFrontOrder(db: any): Order {
  const items = (() => {
    try {
      const raw = db.items ? JSON.parse(typeof db.items === 'string' ? db.items : JSON.stringify(db.items)) : []
      return Array.isArray(raw) ? raw.map((i: any) => ({ name: String(i.name ?? 'Товар'), quantity: Number(i.quantity ?? 1), price: Number(i.price ?? 0) })) : []
    } catch {
      return []
    }
  })()

  const totalAmount = db.price != null ? Number(db.price) : items.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.price), 0)

  const firstName = db.customer?.user?.first_name ?? ''
  const lastName = db.customer?.user?.last_name ?? ''
  const phone = db.customer?.user?.phone ?? db.delivery_contact_phone ?? ''
  const name = `${firstName} ${lastName}`.trim() || (db.delivery_contact_name ?? '')

  const courierFirst = db.delivery?.courier?.user?.first_name ?? ''
  const courierLast = db.delivery?.courier?.user?.last_name ?? ''
  const courierName = `${courierFirst} ${courierLast}`.trim()

  return {
    id: String(db.id),
    customerName: name,
    customerAddress: String(db.delivery_address ?? ''),
    customerPhone: String(phone),
    items,
    totalAmount,
    status: mapStatusDbToFront(db.status?.name ?? 'confirmed'),
    createdAt: new Date(db.created_at ?? Date.now()).toISOString(),
    trackingNumber: String(db.order_number ?? ''),
    deliveryLat: db.delivery_latitude != null ? Number(db.delivery_latitude) : undefined,
    deliveryLng: db.delivery_longitude != null ? Number(db.delivery_longitude) : undefined,
    courierId: db.delivery?.courier?.id ? String(db.delivery.courier.id) : undefined,
    courierName: courierName || undefined,
    courierLat: db.delivery?.courier?.current_latitude != null ? Number(db.delivery.courier.current_latitude) : undefined,
    courierLng: db.delivery?.courier?.current_longitude != null ? Number(db.delivery.courier.current_longitude) : undefined,
    weight: db.weight != null ? Number(db.weight) : undefined,
    volume: db.volume != null ? Number(db.volume) : undefined,
  }
}
