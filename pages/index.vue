<template>
  <div class="container mx-auto p-4 max-w-3xl text-gray-100">
    <h1 class="text-2xl font-bold mb-6">Відстеження посилки за ТТН</h1>
    <div class="mb-3 text-sm text-gray-400 p-3 border border-gray-800 rounded bg-gray-900 flex items-center justify-between">
      <span>тестовий ТТН: ORD-2024-001</span>
      <button class="px-3 py-1 rounded bg-green-600 text-white" @click="ttn='ORD-2024-001'; search()">відстежети</button>
    </div>
    <form class="flex gap-2 mb-4" @submit.prevent="search">
      <input v-model="ttn" class="flex-1 border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Введіть номер ТТН" required >
      <button class="px-4 py-2 rounded bg-blue-600 text-white">Знайти</button>
    </form>
    <div v-if="error" class="text-red-400 mb-3">{{ error }}</div>
    <div v-if="loading" class="flex items-center gap-2 text-gray-400">
      <svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
      <span>Пошук...</span>
    </div>
    <div v-else-if="order" class="mt-4 space-y-4">
      <OrderItem :order="order" :show-admin-controls="false" :allow-status-edit="false" @order-updated="handleOrderUpdated" />
      <div class="border border-gray-800 rounded-lg p-4">
        <div class="text-sm text-gray-400 mb-2">Карта: кур’єр та точка доставки</div>
        <MapView :markers="markers" :points="polylinePoints" :center="mapCenter" />
        <div v-if="order.courierName" class="mt-2 text-sm text-gray-300">Кур’єр: {{ order.courierName }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import OrderItem from '~/components/OrderItem.vue'
import MapView from '~/components/MapView.vue'
import type { Order } from '~/types/order'

const ttn = ref('')
const order = ref<Order | null>(null)
const error = ref('')
const loading = ref(false)

useHead({
  title: 'Відстеження ТТН — Delivery App',
  meta: [
    { name: 'description', content: 'Пошук замовлення за номером ТТН та перегляд статусу доставки.' },
    { name: 'keywords', content: 'ТТН, відстеження, доставка, посилка' },
    { property: 'og:title', content: 'Відстеження ТТН — Delivery App' },
    { property: 'og:description', content: 'Швидке відстеження посилки за номером ТТН.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' }
  ]
})

const search = async () => {
  error.value = ''
  order.value = null
  loading.value = true
  try {
    const data = await $fetch<Order>(`/api/track/${encodeURIComponent(ttn.value.trim())}`)
    order.value = data || null
    if (!order.value) error.value = 'Посилку не знайдено'
  } catch (e: unknown) {
    console.error(e);

    error.value = 'Посилку не знайдено'
  } finally {
    loading.value = false
  }
}

const markers = computed(() => {
  const list: { lat: number; lng: number; label?: string }[] = []
  const o = order.value
  if (!o) return list
  if (Number.isFinite(o.deliveryLat) && Number.isFinite(o.deliveryLng)) {
    list.push({ lat: o.deliveryLat as number, lng: o.deliveryLng as number, label: 'Доставка' })
  }
  if (Number.isFinite(o.courierLat) && Number.isFinite(o.courierLng)) {
    list.push({ lat: o.courierLat as number, lng: o.courierLng as number, label: 'Кур’єр' })
  }
  return list
})

const polylinePoints = ref<{ lat: number; lng: number }[]>([])
async function fetchOsrmRoute(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`
  const res = await fetch(url)
  if (!res.ok) return [a, b]
  const json = await res.json()
  const coords = json?.routes?.[0]?.geometry?.coordinates || []
  if (!Array.isArray(coords) || coords.length === 0) return [a, b]
  return coords.map((c: [number, number]) => ({ lat: Number(c[1]), lng: Number(c[0]) }))
}
watch(order, async (o) => {
  const hasCourier = Number.isFinite(o?.courierLat) && Number.isFinite(o?.courierLng)
  const hasDelivery = Number.isFinite(o?.deliveryLat) && Number.isFinite(o?.deliveryLng)
  if (hasCourier && hasDelivery) {
    const a = { lat: o!.courierLat as number, lng: o!.courierLng as number }
    const b = { lat: o!.deliveryLat as number, lng: o!.deliveryLng as number }
    polylinePoints.value = await fetchOsrmRoute(a, b)
  } else {
    polylinePoints.value = []
  }
}, { immediate: true })

const mapCenter = computed(() => {
  const p0 = markers.value[0]
  return p0 ? { lat: p0.lat, lng: p0.lng } : { lat: 50, lng: 30 }
})

const handleOrderUpdated = (payload: { id: string; rest: Partial<Order> }) => {
  if (order.value?.id === payload.id) {
    Object.assign(order.value, payload.rest)
  }
}
</script>
