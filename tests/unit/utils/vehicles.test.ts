import { describe, it, expect } from 'vitest'
import {
  mapVehicleTypeDbToFront,
  mapVehicleStatusDbToFront,
  mapVehicleTypeFrontToDb,
  mapVehicleStatusFrontToDb,
  toFrontVehicle
} from '~/server/utils/vehicles'

describe('mapVehicleTypeDbToFront', () => {
  it('should map car to car', () => {
    expect(mapVehicleTypeDbToFront('car')).toBe('car')
  })

  it('should map motorcycle to motorcycle', () => {
    expect(mapVehicleTypeDbToFront('motorcycle')).toBe('motorcycle')
  })

  it('should map van to van', () => {
    expect(mapVehicleTypeDbToFront('van')).toBe('van')
  })

  it('should map truck to van', () => {
    expect(mapVehicleTypeDbToFront('truck')).toBe('van')
  })

  it('should map bicycle to motorcycle', () => {
    expect(mapVehicleTypeDbToFront('bicycle')).toBe('motorcycle')
  })

  it('should map scooter to motorcycle', () => {
    expect(mapVehicleTypeDbToFront('scooter')).toBe('motorcycle')
  })

  it('should map unknown type to car', () => {
    expect(mapVehicleTypeDbToFront('unknown')).toBe('car')
    expect(mapVehicleTypeDbToFront('')).toBe('car')
  })
})

describe('mapVehicleStatusDbToFront', () => {
  it('should map active to available', () => {
    expect(mapVehicleStatusDbToFront('active')).toBe('available')
  })

  it('should map maintenance to maintenance', () => {
    expect(mapVehicleStatusDbToFront('maintenance')).toBe('maintenance')
  })

  it('should map inactive to available', () => {
    expect(mapVehicleStatusDbToFront('inactive')).toBe('available')
  })

  it('should map unknown status to available', () => {
    expect(mapVehicleStatusDbToFront('unknown')).toBe('available')
    expect(mapVehicleStatusDbToFront('')).toBe('available')
  })
})

describe('mapVehicleTypeFrontToDb', () => {
  it('should map car to car', () => {
    expect(mapVehicleTypeFrontToDb('car')).toBe('car')
  })

  it('should map motorcycle to motorcycle', () => {
    expect(mapVehicleTypeFrontToDb('motorcycle')).toBe('motorcycle')
  })

  it('should map van to truck', () => {
    expect(mapVehicleTypeFrontToDb('van')).toBe('truck')
  })

  it('should return undefined for undefined input', () => {
    expect(mapVehicleTypeFrontToDb(undefined)).toBeUndefined()
  })

  it('should map unknown type to car', () => {
    // @ts-expect-error testing unknown value
    expect(mapVehicleTypeFrontToDb('unknown')).toBe('car')
  })
})

describe('mapVehicleStatusFrontToDb', () => {
  it('should map available to active', () => {
    expect(mapVehicleStatusFrontToDb('available')).toBe('active')
  })

  it('should map maintenance to maintenance', () => {
    expect(mapVehicleStatusFrontToDb('maintenance')).toBe('maintenance')
  })

  it('should map in_delivery to active', () => {
    expect(mapVehicleStatusFrontToDb('in_delivery')).toBe('active')
  })

  it('should return undefined for undefined input', () => {
    expect(mapVehicleStatusFrontToDb(undefined)).toBeUndefined()
  })

  it('should map unknown status to active', () => {
    // @ts-expect-error testing unknown value
    expect(mapVehicleStatusFrontToDb('unknown')).toBe('active')
  })
})

describe('toFrontVehicle', () => {
  it('should convert database vehicle to front-end format', () => {
    const db = {
      id: 'vehicle-123',
      type: 'car',
      make: 'Toyota',
      model: 'Prius',
      license_plate: 'ABC-1234',
      max_weight: 100,
      status: 'active'
    }

    const result = toFrontVehicle(db)

    expect(result).toEqual({
      id: 'vehicle-123',
      type: 'car',
      model: 'Prius',
      licensePlate: 'ABC-1234',
      capacity: 100,
      status: 'available',
      driverName: undefined
    })
  })

  it('should use make if model is missing', () => {
    const db = {
      id: 'vehicle-123',
      type: 'truck',
      make: 'Ford',
      model: null,
      license_plate: 'XYZ-5678',
      max_weight: 500,
      status: 'active'
    }

    const result = toFrontVehicle(db)

    expect(result.model).toBe('Ford')
    expect(result.type).toBe('van')
  })

  it('should handle empty model and make', () => {
    const db = {
      id: 'vehicle-123',
      type: 'motorcycle',
      make: null,
      model: null,
      license_plate: 'MTR-999',
      max_weight: 50,
      status: 'active'
    }

    const result = toFrontVehicle(db)

    expect(result.model).toBe('')
  })

  it('should extract driver name from first courier', () => {
    const db = {
      id: 'vehicle-123',
      type: 'car',
      model: 'Sedan',
      license_plate: 'DRV-111',
      max_weight: 100,
      status: 'active',
      couriers: [
        {
          user: {
            first_name: 'John',
            last_name: 'Driver'
          }
        }
      ]
    }

    const result = toFrontVehicle(db)

    expect(result.driverName).toBe('John Driver')
  })

  it('should handle missing driver', () => {
    const db = {
      id: 'vehicle-123',
      type: 'car',
      model: 'Sedan',
      license_plate: 'NO-DRV',
      max_weight: 100,
      status: 'active',
      couriers: []
    }

    const result = toFrontVehicle(db)

    expect(result.driverName).toBeUndefined()
  })

  it('should handle empty couriers array', () => {
    const db = {
      id: 'vehicle-123',
      type: 'van',
      model: 'Transit',
      license_plate: 'VAN-222',
      max_weight: 200,
      status: 'maintenance'
    }

    const result = toFrontVehicle(db)

    expect(result.driverName).toBeUndefined()
    expect(result.status).toBe('maintenance')
  })

  it('should convert max_weight to number capacity', () => {
    const db = {
      id: 'vehicle-123',
      type: 'car',
      model: 'Compact',
      license_plate: 'CMP-333',
      max_weight: '75.5',
      status: 'active'
    }

    const result = toFrontVehicle(db)

    expect(result.capacity).toBe(75.5)
    expect(typeof result.capacity).toBe('number')
  })

  it('should handle null max_weight', () => {
    const db = {
      id: 'vehicle-123',
      type: 'bicycle',
      model: 'Bike',
      license_plate: '',
      max_weight: null,
      status: 'active'
    }

    const result = toFrontVehicle(db)

    expect(result.capacity).toBe(0)
  })

  it('should handle missing license_plate', () => {
    const db = {
      id: 'vehicle-123',
      type: 'scooter',
      model: 'Electric Scooter',
      license_plate: null,
      max_weight: 20,
      status: 'active'
    }

    const result = toFrontVehicle(db)

    expect(result.licensePlate).toBe('')
    expect(result.type).toBe('motorcycle')
  })

  it('should always return id as string', () => {
    const db = {
      id: 123,
      type: 'car',
      model: 'Test',
      license_plate: 'TST-000',
      max_weight: 100,
      status: 'active'
    }

    const result = toFrontVehicle(db)

    expect(typeof result.id).toBe('string')
    expect(result.id).toBe('123')
  })
})
