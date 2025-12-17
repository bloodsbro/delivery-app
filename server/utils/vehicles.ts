import type { Vehicle } from '~/types/vehicle'

export function mapVehicleTypeDbToFront(t: string): Vehicle['type'] {
  switch (t) {
    case 'car': return 'car'
    case 'motorcycle': return 'motorcycle'
    case 'van': return 'van'
    case 'truck': return 'van'
    case 'bicycle': return 'motorcycle'
    case 'scooter': return 'motorcycle'
    default: return 'car'
  }
}

export function mapVehicleStatusDbToFront(s: string): Vehicle['status'] {
  switch (s) {
    case 'active': return 'available'
    case 'maintenance': return 'maintenance'
    case 'inactive': return 'available'
    default: return 'available'
  }
}

export function mapVehicleTypeFrontToDb(t?: Vehicle['type']): string | undefined {
  if (!t) return undefined
  switch (t) {
    case 'car': return 'car'
    case 'motorcycle': return 'motorcycle'
    case 'van': return 'truck'
    default: return 'car'
  }
}

export function mapVehicleStatusFrontToDb(s?: Vehicle['status']): string | undefined {
  if (!s) return undefined
  switch (s) {
    case 'available': return 'active'
    case 'maintenance': return 'maintenance'
    case 'in_delivery': return 'active'
    default: return 'active'
  }
}

export function toFrontVehicle(db: any): Vehicle {
  const driverName = db.couriers?.[0]?.user ? `${db.couriers[0].user.first_name} ${db.couriers[0].user.last_name}`.trim() : undefined
  const courierLat = db.couriers?.[0]?.current_latitude
  const courierLng = db.couriers?.[0]?.current_longitude
  const lat = Number(courierLat ?? db.current_latitude ?? NaN)
  const lng = Number(courierLng ?? db.current_longitude ?? NaN)
  return {
    id: String(db.id),
    type: mapVehicleTypeDbToFront(db.type),
    model: db.model || db.make || '',
    licensePlate: db.license_plate || '',
    capacity: Number(db.max_weight ?? 0),
    status: mapVehicleStatusDbToFront(db.status),
    driverName,
    currentLat: Number.isFinite(lat) ? lat : undefined,
    currentLng: Number.isFinite(lng) ? lng : undefined,
    lastLocationUpdate: (db.couriers?.[0]?.last_location_update || db.last_location_update) ? String(db.couriers?.[0]?.last_location_update || db.last_location_update) : undefined,
  }
}
