<template>
  <div class="wrapper">
    <div class="container mx-auto p-4 text-gray-100">
      <div v-if="loading" class="text-center text-gray-400 p-8 border border-gray-800 rounded-lg bg-gray-900 shadow-sm">Завантаження...</div>
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold mb-6">Адміністрування замовлень</h1>
        
        <label class="inline-flex items-center cursor-pointer">
          <input v-model="isAllOrders" type="checkbox" value="" class="sr-only peer">
          <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"/>
          <span class="ms-3 text-sm font-medium">Показати усі замовлення</span>
        </label>
      </div>

      <div class="flex gap-2">
        <NuxtLink to="/admin/users" class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Користувачі</NuxtLink>
        <NuxtLink to="/admin/assign" class="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Розподіл замовлень</NuxtLink>
        <NuxtLink to="/admin/logs" class="px-3 py-2 bg-indigo-600 dark:bg-gray-700 text-white rounded hover:bg-gray-800">Журнал</NuxtLink>
        <NuxtLink to="/admin/analytics" class="px-3 py-2 bg-emerald-700 text-white rounded hover:bg-emerald-800">Аналітика</NuxtLink>
      </div>
      
      <OrderList
        :orders="orderStore.orders"
        :title="`${isAllOrders ? 'Усі' : 'Активні'} замовлення`"
        :show-admin-controls="true"
        :allow-status-edit="true"
        :is-all-orders="isAllOrders"
        @update-status="handleUpdateStatus"
      />
    </div>
    
    <div class="border border-gray-800 rounded-lg p-4">
      <MapView :points="routePoints" :markers="routeMarkers" />
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { useOrderStore } from '~/stores/orders';
import OrderList from '~/components/OrderList.vue';
import MapView from '~/components/MapView.vue'
import type { Order } from '~/types/order';
definePageMeta({ middleware: 'auth', roles: ['admin'] })
useHead({
  title: 'Адміністрування замовлень — Delivery App',
  meta: [
    { name: 'description', content: 'Перегляд і керування замовленнями, побудова маршрутів доставки.' },
    { name: 'keywords', content: 'адмін, замовлення, маршрути, керування' },
    { property: 'og:title', content: 'Адміністрування замовлень — Delivery App' },
    { property: 'og:description', content: 'Інтерфейс адміністратора для роботи із замовленнями.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' }
  ]
})

const { $socket } = useNuxtApp()
onMounted(() => {
  $socket?.on('order:created', async () => { await orderStore.fetchOrders() })
  $socket?.on('order:status_changed', async () => { await orderStore.fetchOrders() })
  $socket?.on('order:assigned', async () => { await orderStore.fetchOrders() })
})

const orderStore = useOrderStore();

const isAllOrders = ref(false);
const loading = ref(true)

// Завантажуємо закази при завантаженні сторінки
onMounted(async () => {
  await orderStore.fetchOrders();
  loading.value = false
});

const handleUpdateStatus = async (payload: { orderId: string; status: Order['status'] }) => {
  try {
    await orderStore.updateOrderStatus(payload.orderId, payload.status);
    alert('Статус замовлення успішно оновлено!');
  } catch (e) {
    alert('Помилка під час оновлення статусу замовлення.');
    console.error(e);
  }
};

const routePoints = ref<{ lat: number; lng: number }[]>([])
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
const routeMarkers = computed(() => {
  const pts = routePoints.value
  if (!pts.length) return []
  const start = pts[0]
  const end = pts[pts.length - 1]
  return [ { lat: start.lat, lng: start.lng, label: 'Початок' }, { lat: end.lat, lng: end.lng, label: 'Кінець' } ]
})

watch(() => orderStore.orders, async (list) => {
  const pts = (list || [])
    .map(o => ({ lat: o.deliveryLat as number, lng: o.deliveryLng as number }))
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))
  routePoints.value = await computeRoadRoute(pts)
}, { immediate: true })
</script>
