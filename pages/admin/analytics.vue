<template>
  <div class="container mx-auto p-4 text-gray-100">
    <h1 class="text-2xl font-bold mb-6">Аналітика</h1>

    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
       <div class="bg-gray-800 p-8 rounded-lg shadow-xl text-center border border-gray-700">
         <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"/>
         <p class="text-lg font-medium text-white">Дані завантажуються, почекайте...</p>
       </div>
    </div>

    <div v-if="data" class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="bg-gray-900 p-4 rounded border border-gray-800">
          <h3 class="text-sm text-gray-400">Всього замовлень</h3>
          <p class="text-2xl font-bold text-white">{{ data.stats.totalOrders }}</p>
        </div>
        <div class="bg-gray-900 p-4 rounded border border-gray-800">
          <h3 class="text-sm text-gray-400">Загальний дохід</h3>
          <p class="text-2xl font-bold text-green-400">{{ formatCurrency(data.stats.totalRevenue) }}</p>
        </div>
        <div class="bg-gray-900 p-4 rounded border border-gray-800">
          <h3 class="text-sm text-gray-400">Сер. чек</h3>
          <p class="text-2xl font-bold text-blue-400">{{ formatCurrency(data.stats.averageOrderValue) }}</p>
        </div>
        <div class="bg-gray-900 p-4 rounded border border-gray-800">
          <h3 class="text-sm text-gray-400">Активні кур'єри</h3>
          <p class="text-2xl font-bold text-purple-400">{{ data.stats.activeCouriersCount }}</p>
        </div>
        <div class="bg-gray-900 p-4 rounded border border-gray-800">
          <h3 class="text-sm text-gray-400">Активні ТЗ</h3>
          <p class="text-2xl font-bold text-orange-400">{{ data.stats.activeVehiclesCount }}</p>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="p-4 bg-gray-900 border border-gray-800 rounded">
          <h2 class="text-lg font-semibold mb-3">Замовлення за днями</h2>
          <div class="relative h-64 w-full">
            <canvas ref="ordersLineRef"/>
          </div>
        </div>
        
        <div class="p-4 bg-gray-900 border border-gray-800 rounded">
          <h2 class="text-lg font-semibold mb-3">Дохід за днями</h2>
          <div class="relative h-64 w-full">
            <canvas ref="revenueLineRef"/>
          </div>
        </div>

        <div class="p-4 bg-gray-900 border border-gray-800 rounded">
          <h2 class="text-lg font-semibold mb-3">Статуси замовлень</h2>
          <div class="relative h-64 w-full">
            <canvas ref="ordersPieRef"/>
          </div>
        </div>

        <div class="p-4 bg-gray-900 border border-gray-800 rounded">
          <h2 class="text-lg font-semibold mb-3">Статуси ТЗ</h2>
          <div class="relative h-64 w-full">
            <canvas ref="vehiclesBarRef"/>
          </div>
        </div>
        
        <div class="p-4 bg-gray-900 border border-gray-800 rounded lg:col-span-2">
          <h2 class="text-lg font-semibold mb-3">Топ 5 кур'єрів (виконані доставки)</h2>
          <div class="relative h-64 w-full">
            <canvas ref="couriersBarRef"/>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 flex items-center gap-2">
      <label class="text-sm">Днів:</label>
      <input v-model.number="days" type="number" min="7" max="60" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 w-24" >
      <button class="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50" :disabled="loading" @click="load">
        {{ loading ? 'Завантаження...' : 'Оновити' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import { PERMISSIONS } from '~/utils/permissions'

definePageMeta({ middleware: 'auth', permissions: [PERMISSIONS.VIEW_ANALYTICS] })
useHead({
  title: 'Аналітика — Delivery App',
  meta: [
    { name: 'description', content: 'Аналітичні графіки по замовленням і транспортним засобам.' },
    { name: 'keywords', content: 'аналітика, графіки, замовлення, транспорт, дохід, кур\'єри' }
  ]
})

Chart.register(...registerables)

const ordersLineRef = ref<HTMLCanvasElement | null>(null)
const revenueLineRef = ref<HTMLCanvasElement | null>(null)
const ordersPieRef = ref<HTMLCanvasElement | null>(null)
const vehiclesBarRef = ref<HTMLCanvasElement | null>(null)
const couriersBarRef = ref<HTMLCanvasElement | null>(null)

let ordersLine: Chart | null = null
let revenueLine: Chart | null = null
let ordersPie: Chart | null = null
let vehiclesBar: Chart | null = null
let couriersBar: Chart | null = null

const days = ref(14)
const loading = ref(false)

interface AnalyticsData {
  ordersByDay: { date: string; count: number }[];
  revenueByDay: { date: string; sum: number }[];
  ordersByStatus: { status: string; count: number }[];
  vehiclesByStatus: { status: string; count: number }[];
  stats: {
    totalRevenue: number;
    totalOrders: number;
    activeCouriersCount: number;
    activeVehiclesCount: number;
    averageOrderValue: number;
  };
  topCouriers: { name: string; count: number }[];
}

const data = ref<AnalyticsData | null>(null)

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(val)
}

const load = async () => {
  loading.value = true
  try {
    const d = await $fetch<AnalyticsData>('/api/admin/analytics', { query: { days: days.value } })
    data.value = d
    // Give Vue a tick to render the canvas elements
    await nextTick()
    renderCharts()
  } catch (e) {
    console.error('Failed to load analytics:', e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

const renderCharts = () => {
  if (!data.value) return

  // Destroy existing charts
  if (ordersLine) ordersLine.destroy()
  if (revenueLine) revenueLine.destroy()
  if (ordersPie) ordersPie.destroy()
  if (vehiclesBar) vehiclesBar.destroy()
  if (couriersBar) couriersBar.destroy()

  // Orders Line Chart
  const lineLabels = data.value.ordersByDay.map(x => x.date)
  const lineData = data.value.ordersByDay.map(x => x.count)
  if (ordersLineRef.value) {
    ordersLine = new Chart(ordersLineRef.value, { 
      type: 'line', 
      data: { 
        labels: lineLabels, 
        datasets: [{ label: 'Замовлення', data: lineData, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)', tension: 0.3, fill: true }] 
      }, 
      options: { responsive: true, maintainAspectRatio: false } 
    })
  }

  // Revenue Line Chart
  const revLabels = data.value.revenueByDay.map(x => x.date)
  const revData = data.value.revenueByDay.map(x => x.sum)
  if (revenueLineRef.value) {
    revenueLine = new Chart(revenueLineRef.value, { 
      type: 'line', 
      data: { 
        labels: revLabels, 
        datasets: [{ label: 'Дохід (UAH)', data: revData, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.2)', tension: 0.3, fill: true }] 
      }, 
      options: { responsive: true, maintainAspectRatio: false } 
    })
  }

  // Status Pie Chart
  const pieLabels = data.value.ordersByStatus.map(x => x.status)
  const pieData = data.value.ordersByStatus.map(x => x.count)
  if (ordersPieRef.value) {
    ordersPie = new Chart(ordersPieRef.value, { 
      type: 'doughnut', 
      data: { 
        labels: pieLabels, 
        datasets: [{ data: pieData, backgroundColor: ['#22c55e','#3b82f6','#ef4444','#f59e0b','#a855f7','#6366f1'] }] 
      }, 
      options: { responsive: true, maintainAspectRatio: false } 
    })
  }

  // Vehicle Status Bar Chart
  const barLabels = data.value.vehiclesByStatus.map(x => x.status)
  const barData = data.value.vehiclesByStatus.map(x => x.count)
  if (vehiclesBarRef.value) {
    vehiclesBar = new Chart(vehiclesBarRef.value, { 
      type: 'bar', 
      data: { 
        labels: barLabels, 
        datasets: [{ label: 'ТЗ', data: barData, backgroundColor: '#f97316' }] 
      }, 
      options: { responsive: true, maintainAspectRatio: false } 
    })
  }

  // Top Couriers Bar Chart
  const courierLabels = data.value.topCouriers.map(x => x.name)
  const courierData = data.value.topCouriers.map(x => x.count)
  if (couriersBarRef.value) {
    couriersBar = new Chart(couriersBarRef.value, { 
      type: 'bar', 
      data: { 
        labels: courierLabels, 
        datasets: [{ label: 'Доставки', data: courierData, backgroundColor: '#a855f7' }] 
      }, 
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' } 
    })
  }
}

const { $socket } = useNuxtApp()
onMounted(() => {
  $socket?.on('order:created', async () => { await load() })
  $socket?.on('order:status_changed', async () => { await load() })
  $socket?.on('order:assigned', async () => { await load() })
})
</script>
