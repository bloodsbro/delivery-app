import { NitroApp } from 'nitropack'

declare module 'nitropack' {
  interface NitroApp {
    broadcast: {
      orderCreated(payload: unknown): void
      orderStatusChanged(payload: unknown): void
      orderAssigned(payload: unknown): void
      courierLocationUpdated(payload: unknown): void
    }
  }
}
