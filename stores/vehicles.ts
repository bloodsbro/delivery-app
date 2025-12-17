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
      const { data, error } = await useFetch<Vehicle[]>('/api/vehicles');
      if (data.value) {
        this.vehicles = data.value;
      }
      if (error.value) {
        console.error('Помилка при завантаженні транспортних засобів:', error.value);
        throw error.value;
      }
    },
    async createVehicle(payload: Partial<Vehicle>) {
      const { data, error } = await useFetch<Vehicle>('/api/vehicles', { method: 'POST', body: payload })
      if (error.value) throw error.value
      if (data.value) this.vehicles.unshift(data.value)
      return data.value
    },
    async updateVehicle(id: string, payload: Partial<Vehicle>) {
      const { data, error } = await useFetch<Vehicle>(`/api/vehicles/${id}`, { method: 'PUT', body: payload })
      if (error.value) throw error.value
      const idx = this.vehicles.findIndex(v => v.id === id)
      if (idx !== -1 && data.value) this.vehicles[idx] = data.value
      return data.value
    },
    async deleteVehicle(id: string) {
      const { error } = await useFetch(`/api/vehicles/${id}`, { method: 'DELETE' })
      if (error.value) throw error.value
      this.vehicles = this.vehicles.filter(v => v.id !== id)
    }
  },
});
