import prisma from '~/lib/prisma'

export async function listVehicles() {
  return prisma.vehicle.findMany({ include: { couriers: { include: { user: true } } }, orderBy: { created_at: 'desc' } })
}

export async function createVehicle(data: { type: any; model?: string; licensePlate?: string; capacity?: number; status?: any; currentLat?: number; currentLng?: number }) {
  return prisma.vehicle.create({ data: {
    type: data.type,
    model: data.model || null,
    license_plate: data.licensePlate || null,
    max_weight: data.capacity ?? null,
    status: (data.status || 'active'),
    current_latitude: data.currentLat != null ? (data.currentLat) : undefined,
    current_longitude: data.currentLng != null ? (data.currentLng) : undefined,
    last_location_update: (data.currentLat != null && data.currentLng != null) ? new Date() : undefined,
  }, include: { couriers: { include: { user: true } } } })
}

export async function updateVehicle(id: string, data: { type?: any; model?: string; licensePlate?: string; capacity?: number; status?: any; currentLat?: number; currentLng?: number }) {
  return prisma.vehicle.update({ where: { id }, data: {
    type: data.type ?? undefined,
    model: data.model ?? undefined,
    license_plate: data.licensePlate ?? undefined,
    max_weight: data.capacity ?? undefined,
    status: data.status ?? undefined,
    current_latitude: data.currentLat != null ? (data.currentLat) : undefined,
    current_longitude: data.currentLng != null ? (data.currentLng) : undefined,
    last_location_update: (data.currentLat != null && data.currentLng != null) ? new Date() : undefined,
  }, include: { couriers: { include: { user: true } } } })
}

export async function deleteVehicle(id: string) {
  await prisma.vehicle.delete({ where: { id } })
}
