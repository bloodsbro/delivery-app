import { defineStore } from 'pinia';
import type { Vehicle } from '~/types/vehicle';

interface VehicleState {
  vehicles: Vehicle[];
}

export const useVehicleStore = defineStore('vehicles', {
  state: (): VehicleState => ({
    vehicles: [],
  }),
  actions: {
    async fetchVehicles() {
      try {
        const data = await $fetch<Vehicle[]>('/api/vehicles');
        if (data) {
          this.vehicles = data;
        }
      } catch (error) {
        console.error('Помилка при завантаженні транспортних засобів:', error);
        throw error;
      }
    },
    async createVehicle(payload: Partial<Vehicle>) {
      try {
        const data = await $fetch<Vehicle>('/api/vehicles', { method: 'POST', body: payload })
        return data;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    async updateVehicle(id: string, payload: Partial<Vehicle>) {
      try {
        const data = await $fetch<Vehicle>(`/api/vehicles/${id}`, { method: 'PUT', body: payload })
        const idx = this.vehicles.findIndex(v => v.id === id)
        if (idx !== -1 && data) this.vehicles[idx] = data
        
        return data
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    async deleteVehicle(id: string) {
      try {
        // @ts-expect-error: Тип помилки не відповідає очікуваному типу
        await $fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
        this.vehicles = this.vehicles.filter(v => v.id !== id)
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  },
});
