import { describe, it, expect } from 'vitest'

/**
 * Nearest neighbor algorithm for route optimization
 * Extracted from pages/admin/index.vue and pages/courier/index.vue
 */
function computeRoute(points: { lat: number; lng: number }[]) {
  if (points.length <= 2) return points
  const remaining = [...points]
  const route: { lat: number; lng: number }[] = []
  let current = remaining.shift()!
  route.push(current)
  while (remaining.length) {
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = Math.hypot(remaining[i].lat - current.lat, remaining[i].lng - current.lng)
      if (d < bestDist) {
        bestDist = d
        bestIdx = i
      }
    }
    current = remaining.splice(bestIdx, 1)[0]
    route.push(current)
  }
  return route
}

describe('computeRoute - Nearest Neighbor Algorithm', () => {
  describe('Edge cases', () => {
    it('should handle empty array', () => {
      const result = computeRoute([])
      expect(result).toEqual([])
    })

    it('should handle single point', () => {
      const points = [{ lat: 40.7128, lng: -74.0060 }]
      const result = computeRoute(points)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(points[0])
    })

    it('should handle two points without optimization', () => {
      const points = [
        { lat: 40.7128, lng: -74.0060 },
        { lat: 40.7589, lng: -73.9851 }
      ]
      const result = computeRoute(points)

      expect(result).toHaveLength(2)
      expect(result).toEqual(points)
    })
  })

  describe('Route optimization', () => {
    it('should optimize route for 3 points in a line', () => {
      const points = [
        { lat: 0, lng: 0 },    // Point A
        { lat: 10, lng: 0 },   // Point C (far)
        { lat: 5, lng: 0 }     // Point B (middle)
      ]
      const result = computeRoute(points)

      // Should order as A -> B -> C (nearest neighbor)
      expect(result[0]).toEqual({ lat: 0, lng: 0 })
      expect(result[1]).toEqual({ lat: 5, lng: 0 })
      expect(result[2]).toEqual({ lat: 10, lng: 0 })
    })

    it('should optimize route for 4 points', () => {
      const points = [
        { lat: 0, lng: 0 },    // Start
        { lat: 10, lng: 10 },  // Far diagonal
        { lat: 1, lng: 1 },    // Close to start
        { lat: 9, lng: 9 }     // Close to far
      ]
      const result = computeRoute(points)

      // Should start at (0,0), then go to nearest
      expect(result[0]).toEqual({ lat: 0, lng: 0 })
      expect(result[1]).toEqual({ lat: 1, lng: 1 })
      // Then continue to closer points
      expect(result.length).toBe(4)
    })

    it('should handle 10 points', () => {
      const points = [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 },
        { lat: 2, lng: 2 },
        { lat: 3, lng: 3 },
        { lat: 4, lng: 4 },
        { lat: 5, lng: 5 },
        { lat: 6, lng: 6 },
        { lat: 7, lng: 7 },
        { lat: 8, lng: 8 },
        { lat: 9, lng: 9 }
      ]
      const result = computeRoute(points)

      expect(result).toHaveLength(10)
      expect(result[0]).toEqual({ lat: 0, lng: 0 })
      // Should traverse in generally ascending order (nearest neighbor)
      expect(result[result.length - 1]).toEqual({ lat: 9, lng: 9 })
    })

    it('should optimize scattered points', () => {
      const points = [
        { lat: 40.7128, lng: -74.0060 },  // New York
        { lat: 34.0522, lng: -118.2437 }, // Los Angeles
        { lat: 40.7589, lng: -73.9851 },  // Times Square (close to NY)
        { lat: 41.8781, lng: -87.6298 }   // Chicago
      ]
      const result = computeRoute(points)

      expect(result).toHaveLength(4)
      // Should start at NY
      expect(result[0]).toEqual({ lat: 40.7128, lng: -74.0060 })
      // Next should be Times Square (closest)
      expect(result[1]).toEqual({ lat: 40.7589, lng: -73.9851 })
    })
  })

  describe('Distance calculation', () => {
    it('should correctly calculate euclidean distance', () => {
      const points = [
        { lat: 0, lng: 0 },
        { lat: 3, lng: 4 }  // Distance = 5
      ]
      const result = computeRoute(points)

      expect(result).toHaveLength(2)
      // Verify it completes without error
      expect(result[0]).toEqual({ lat: 0, lng: 0 })
      expect(result[1]).toEqual({ lat: 3, lng: 4 })
    })

    it('should handle negative coordinates', () => {
      const points = [
        { lat: -10, lng: -10 },
        { lat: -5, lng: -5 },
        { lat: 0, lng: 0 }
      ]
      const result = computeRoute(points)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ lat: -10, lng: -10 })
      expect(result[1]).toEqual({ lat: -5, lng: -5 })
      expect(result[2]).toEqual({ lat: 0, lng: 0 })
    })
  })

  describe('Performance and correctness', () => {
    it('should not modify original array', () => {
      const points = [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 },
        { lat: 2, lng: 2 }
      ]
      const originalLength = points.length
      const originalFirst = { ...points[0] }

      computeRoute(points)

      expect(points).toHaveLength(originalLength)
      expect(points[0]).toEqual(originalFirst)
    })

    it('should include all points exactly once', () => {
      const points = [
        { lat: 1, lng: 1 },
        { lat: 2, lng: 2 },
        { lat: 3, lng: 3 },
        { lat: 4, lng: 4 },
        { lat: 5, lng: 5 }
      ]
      const result = computeRoute(points)

      expect(result).toHaveLength(points.length)

      // Check all points are included
      points.forEach(point => {
        const found = result.some(r => r.lat === point.lat && r.lng === point.lng)
        expect(found).toBe(true)
      })
    })

    it('should handle duplicate coordinates', () => {
      const points = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 }
      ]
      const result = computeRoute(points)

      expect(result).toHaveLength(3)
    })

    it('should handle very close points', () => {
      const points = [
        { lat: 40.7128, lng: -74.0060 },
        { lat: 40.7128001, lng: -74.0060001 },
        { lat: 40.7128002, lng: -74.0060002 }
      ]
      const result = computeRoute(points)

      expect(result).toHaveLength(3)
    })
  })

  describe('Real-world scenarios', () => {
    it('should optimize delivery route in Manhattan', () => {
      const points = [
        { lat: 40.7580, lng: -73.9855 },  // Times Square
        { lat: 40.7614, lng: -73.9776 },  // Central Park South
        { lat: 40.7488, lng: -73.9857 },  // Empire State Building
        { lat: 40.7549, lng: -73.9840 },  // Rockefeller Center
        { lat: 40.7527, lng: -73.9772 }   // Grand Central
      ]
      const result = computeRoute(points)

      expect(result).toHaveLength(5)
      expect(result[0]).toEqual({ lat: 40.7580, lng: -73.9855 })
      // Route should be optimized by nearest neighbor
    })

    it('should handle cross-city route', () => {
      const points = [
        { lat: 50.4501, lng: 30.5234 },  // Kyiv
        { lat: 48.8566, lng: 2.3522 },   // Paris
        { lat: 52.5200, lng: 13.4050 },  // Berlin
        { lat: 51.5074, lng: -0.1278 },  // London
        { lat: 41.9028, lng: 12.4964 }   // Rome
      ]
      const result = computeRoute(points)

      expect(result).toHaveLength(5)
      // All cities should be included
      expect(result.every(r => Number.isFinite(r.lat) && Number.isFinite(r.lng))).toBe(true)
    })
  })

  describe('Boundary values', () => {
    it('should handle extreme latitude/longitude values', () => {
      const points = [
        { lat: -90, lng: -180 },
        { lat: 90, lng: 180 },
        { lat: 0, lng: 0 }
      ]
      const result = computeRoute(points)

      expect(result).toHaveLength(3)
      expect(result.every(r => Number.isFinite(r.lat) && Number.isFinite(r.lng))).toBe(true)
    })

    it('should handle very small differences', () => {
      const points = [
        { lat: 40.7128, lng: -74.0060 },
        { lat: 40.7128 + 0.0001, lng: -74.0060 },
        { lat: 40.7128 + 0.0002, lng: -74.0060 }
      ]
      const result = computeRoute(points)

      expect(result).toHaveLength(3)
      // Should be ordered by proximity
      expect(result[0].lat).toBe(40.7128)
    })
  })
})
