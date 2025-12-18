<template>
  <div class="wrapper">
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold text-gray-100 mb-8 text-center">Наші транспортні засоби</h1>
    <div class="max-w-2xl mx-auto mb-6 p-4 border border-gray-800 rounded bg-gray-900 shadow-sm">
      <h2 class="text-lg font-semibold mb-3">Додати / Редагувати транспортний засіб</h2>
      <form class="grid grid-cols-1 md:grid-cols-2 gap-3" @submit.prevent="save">
        <select v-model="form.type" class="border rounded p-2 bg-gray-800 text-gray-100" required>
          <option value="car">Легковий</option>
          <option value="van">Вантажний</option>
          <option value="motorcycle">Мото</option>
        </select>
        <input v-model="form.model" class="border rounded p-2 bg-gray-800 text-gray-100 placeholder-gray-400" placeholder="Модель" >
        <input v-model="form.licensePlate" class="border rounded p-2 bg-gray-800 text-gray-100 placeholder-gray-400" placeholder="Номер" >
        <input v-model.number="form.capacity" type="number" class="border rounded p-2 bg-gray-800 text-gray-100 placeholder-gray-400" placeholder="Вантажопідйомність" >
        <select v-model="form.status" class="border rounded p-2 bg-gray-800 text-gray-100 placeholder-gray-400">
          <option value="available">Доступний</option>
          <option value="maintenance">На обслуговуванні</option>
        </select>
        <div class="col-span-1 md:col-span-2 flex gap-2">
          <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded">Зберегти</button>
          <button v-if="form.id" type="button" class="bg-gray-600 text-white px-4 py-2 rounded" @click="reset">Скасувати</button>
        </div>
      </form>
    </div>
      
      <div v-if="vehicleStore.vehicles.length === 0" class="text-center text-gray-400 p-8 border border-gray-800 rounded-lg bg-gray-900 shadow-sm">
        <p class="text-lg">Наразі немає зареєстрованих транспортних засобів.</p>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <VehicleCard
          v-for="vehicle in vehicleStore.vehicles"
          :key="vehicle.id"
          :vehicle="vehicle"
          :show-actions="auth.user?.role === 'admin'"
          @select="handleCardClick"
          @delete="handleDelete"
        />
      </div>
      
      <div class="mt-4 text-sm text-gray-600">Натисніть на картку для редагування, або видалення.</div>
    </div>
    
    <div class="border border-gray-800 rounded-lg p-4">
      <MapView :markers="vehicleMarkers" :center="mapCenter" @marker-click="onMarkerClick" />
      <div v-if="selectedVehicleInfo" class="mt-3 text-sm text-gray-300">{{ selectedVehicleInfo }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVehicleStore } from '~/stores/vehicles';
import { useOrderStore } from '~/stores/orders';
import VehicleCard from '~/components/VehicleCard.vue';
import MapView from '~/components/MapView.vue'
import type { Vehicle } from '~/types/vehicle'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: 'auth', roles: ['admin'] })
useHead({
  title: 'Транспортні засоби — Delivery App',
  meta: [
    { name: 'description', content: 'Перегляд і керування транспортними засобами компанії на карті.' },
    { name: 'keywords', content: 'транспорт, карта, керування' },
    { property: 'og:title', content: 'Транспортні засоби — Delivery App' },
    { property: 'og:description', content: 'Список ТЗ та їх розташування.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' }
  ]
})

const vehicleStore = useVehicleStore();
const orderStore = useOrderStore();
const auth = useAuthStore()
const form = reactive<Partial<Vehicle>>({ type: 'car', status: 'available' })

const save = async () => {
  if (!form.id) {
    await vehicleStore.createVehicle(form)
  } else {
    await vehicleStore.updateVehicle(form.id as string, form)
  }
  reset()
}

const reset = () => { Object.assign(form, { id: undefined, type: 'car', model: '', licensePlate: '', capacity: undefined, status: 'available' }) }

const handleCardClick = (v: Vehicle) => { Object.assign(form, v) }
const handleDelete = async (id: string) => { await vehicleStore.deleteVehicle(id) ; if (form.id === id) reset() }

onMounted(async () => {
  if (vehicleStore.vehicles.length === 0) {
    await vehicleStore.fetchVehicles();
  }
  if ((orderStore.orders || []).length === 0) {
    try { await orderStore.fetchOrders() } catch {
      console.error('Error fetching orders');
    }
  }
});

const { $socket } = useNuxtApp()
onMounted(() => {
  $socket?.on('order:assigned', async () => { await vehicleStore.fetchVehicles() })
  $socket?.on('order:status_changed', async () => { await vehicleStore.fetchVehicles() })
  $socket?.on('courier:location', async () => { await vehicleStore.fetchVehicles() })
})

const selectedVehicleInfo = ref('')
const mapCenter = computed(() => {
  const v = (vehicleStore.vehicles || []).find(v => Number.isFinite(v.currentLat) && Number.isFinite(v.currentLng))
  return { lat: v?.currentLat ?? 50, lng: v?.currentLng ?? 30 }
})
const vehicleMarkers = computed(() => {
  const vs = vehicleStore.vehicles || []
  return vs.map(v => ({
    lat: Number.isFinite(v.currentLat as number) ? (v.currentLat as number) : (50 + Math.random() * 0.1),
    lng: Number.isFinite(v.currentLng as number) ? (v.currentLng as number) : (30 + Math.random() * 0.1),
    id: v.id,
    label: v.model,
    info: `${v.model} · ${v.licensePlate} · ${statusLabel(v.status)}`
  }))
})
function statusLabel(s: Vehicle['status']) {
  switch (s) {
    case 'available': return 'Доступний'
    case 'in_delivery': return 'У доставці'
    case 'maintenance': return 'На обслуговуванні'
    default: return String(s)
  }
}
function onMarkerClick(m: { id: string; info: string, label?: string }) { selectedVehicleInfo.value = String(m.info || m.label || '') }
</script>
