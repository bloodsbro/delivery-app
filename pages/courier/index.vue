<template>
  <div class="container mx-auto p-4 text-gray-100">
    <h1 class="text-2xl font-bold mb-6">Мої доставки</h1>
    <div class="mb-4 flex gap-2">
      <button class="px-3 py-2 bg-emerald-600 text-white rounded" @click="updateMyLocation">Оновити моє місцезнаходження</button>
      <label class="inline-flex items-center cursor-pointer">
        <input v-model="autoEnabled" type="checkbox" value="" class="sr-only peer">
        <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"/>
        <span class="ms-3 text-sm font-medium">Автооновлення</span>
      </label>
      <span v-if="lastUpdate" class="text-sm text-gray-400">Оновлено: {{ new Date(lastUpdate).toLocaleTimeString() }}</span>
    </div>
    <div v-if="loading" class="text-center text-gray-400 p-8 border border-gray-800 rounded-lg bg-gray-900 shadow-sm">Завантаження...</div>
    <div v-else>
      <MapView :points="routePoints" :markers="routeMarkers" />
      <OrderList
        class="mt-6"
        :orders="orders"
        title="Мої замовлення"
        :show-admin-controls="false"
        :allow-status-edit="true"
        :is-all-orders="false"
        :selectable="true"
        :selected-ids="selectedOrderIds"
        @update-status="handleUpdateStatus"
        @toggle-selection="toggleSelection"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import MapView from '~/components/MapView.vue'
import OrderList from '~/components/OrderList.vue'
import type { Order } from '~/types/order'

definePageMeta({ middleware: 'auth', roles: ['courier'] })
useHead({
  title: 'Кабінет кур’єра — Delivery App',
  meta: [
    { name: 'description', content: 'Маршрут кур’єра, список його замовлень та оновлення статусів.' },
    { name: 'keywords', content: 'кур’єр, маршрут, замовлення' },
    { property: 'og:title', content: 'Кабінет кур’єра — Delivery App' },
    { property: 'og:description', content: 'Інструменти кур’єра для роботи з доставками.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' }
  ]
})
const loading = ref(true)
const orders = ref<Order[]>([])
const selectedOrderIds = ref(new Set<string>())
const toggleSelection = (id: string) => {
  const newSet = new Set(selectedOrderIds.value)
  if (newSet.has(id)) newSet.delete(id)
  else newSet.add(id)
  selectedOrderIds.value = newSet
}
const lastUpdate = ref<string>('')
const autoEnabled = ref(true)
const geoWatchId = ref<number | null>(null)
let lastSentAt = 0
const minIntervalMs = 15000
const load = async () => {
  const { data } = await useFetch<Order[]>('/api/courier/orders')
  orders.value = data.value || []
  loading.value = false
}
const routePoints = ref<{ lat: number; lng: number }[]>([])
const routeMarkers = computed(() => {
  const pts = routePoints.value
  if (!pts.length) return []
  const start = pts[0]
  const end = pts[pts.length - 1]
  return [ { lat: start.lat, lng: start.lng, label: 'Старт' }, { lat: end.lat, lng: end.lng, label: 'Фініш' } ]
})
async function fetchOsrmSegment(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`
  const res = await fetch(url)
  if (!res.ok) return [a, b]
  const json = await res.json()
  const coords = json?.routes?.[0]?.geometry?.coordinates || []
  if (!Array.isArray(coords) || coords.length === 0) return [a, b]
  return coords.map((c: [number, number]) => ({ lat: Number(c[1]), lng: Number(c[0]) }))
}
async function computeRoadRoute(points: { lat: number; lng: number }[]) {
  console.log('computeRoadRoute', points)
  const pts = points.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))
  if (pts.length <= 1) return pts
  const remaining = [...pts]
  const ordered: { lat: number; lng: number }[] = []
  let current = remaining.shift()!
  ordered.push(current)
  while (remaining.length) {
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = Math.hypot(remaining[i].lat - current.lat, remaining[i].lng - current.lng)
      if (d < bestDist) { bestDist = d; bestIdx = i }
    }
    current = remaining.splice(bestIdx, 1)[0]
    ordered.push(current)
  }
  const poly: { lat: number; lng: number }[] = []
  for (let i = 0; i < ordered.length - 1; i++) {
    const segment = await fetchOsrmSegment(ordered[i], ordered[i + 1])
    if (!segment.length) {
      poly.push(ordered[i], ordered[i + 1])
    } else {
      if (poly.length && segment.length) segment.shift()
      poly.push(...segment)
    }
  }
  return poly.length ? poly : ordered
}
watch(orders, async (list) => {
  const pts = (list || []).map(o => ({ lat: o.deliveryLat as number, lng: o.deliveryLng as number }))
  routePoints.value = await computeRoadRoute(pts)
}, { immediate: true })
onMounted(load)
const { $socket } = useNuxtApp()
onMounted(() => {
  $socket?.on('order:assigned', async () => { await load() })
  $socket?.on('order:status_changed', async () => { await load() })
  $socket?.on('courier:location', async () => { /* у разі потреби перерахувати маршрут */ })
  startAutoGeo()
})
onUnmounted(() => { if (geoWatchId.value !== null) { try { navigator.geolocation.clearWatch(geoWatchId.value) } catch {
  /* empty */
} } })

const handleUpdateStatus = async (payload: { orderId: string; status: string }) => {
  const data = await $fetch<Order>(`/api/orders/${payload.orderId}`, { method: 'PUT', body: { status: payload.status } })
  const updated = data
  orders.value = (orders.value || []).map(o => o.id === payload.orderId ? updated : o)
}

const updateMyLocation = async () => {
  if (!('geolocation' in navigator)) { alert('Геолокація недоступна'); return }
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords
    try {
      const data = await $fetch('/api/courier/location', { method: 'PUT', body: { lat: latitude, lng: longitude } })
      lastUpdate.value = data?.at || ''
    } catch (e) {
      alert('Не вдалося оновити геолокацію')
      console.error(e)
    }
  }, (err) => {
    alert('Помилка доступу до геолокації')
    console.error(err)
  }, { enableHighAccuracy: true, timeout: 10000 })
}

const startAutoGeo = () => {
  if (!autoEnabled.value) return
  if (!('geolocation' in navigator)) return
  try {
    geoWatchId.value = navigator.geolocation.watchPosition(async (pos) => {
      const now = Date.now()
      if (now - lastSentAt < minIntervalMs) return
      lastSentAt = now
      const { latitude, longitude } = pos.coords
      try {
        const data = await $fetch('/api/courier/location', { method: 'PUT', body: { lat: latitude, lng: longitude } })
        lastUpdate.value = data?.at || ''
      } catch (e) {
        console.error(e)
      }
    }, (err) => {
      console.error(err)
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 })
  } catch {
    /* empty */
  }
}

watch(autoEnabled, (val) => {
  if (!('geolocation' in navigator)) return
  try {
    if (val) {
      startAutoGeo()
    } else {
      if (geoWatchId.value !== null) navigator.geolocation.clearWatch(geoWatchId.value)
      geoWatchId.value = null
    }
  } catch {
    /* empty */
  }
})
</script>
