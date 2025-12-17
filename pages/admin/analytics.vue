<template>
  <div class="container mx-auto p-4 text-gray-100">
    <h1 class="text-2xl font-bold mb-6">Аналітика</h1>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="p-4 bg-gray-900 border border-gray-800 rounded">
        <h2 class="text-lg font-semibold mb-3">Замовлення за днями</h2>
        <canvas ref="ordersLineRef" class="w-full h-64"/>
      </div>
      <div class="p-4 bg-gray-900 border border-gray-800 rounded">
        <h2 class="text-lg font-semibold mb-3">Статуси замовлень</h2>
        <canvas ref="ordersPieRef" class="w-full h-64"/>
      </div>
      <div class="p-4 bg-gray-900 border border-gray-800 rounded">
        <h2 class="text-lg font-semibold mb-3">Статуси ТЗ</h2>
        <canvas ref="vehiclesBarRef" class="w-full h-64"/>
      </div>
    </div>
    <div class="mt-6 flex items-center gap-2">
      <label class="text-sm">Днів:</label>
      <input v-model.number="days" type="number" min="7" max="60" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 w-24" >
      <button class="px-3 py-2 bg-blue-600 text-white rounded" @click="load">Оновити</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
definePageMeta({ middleware: 'auth', roles: ['admin'] })
useHead({
  title: 'Аналітика — Delivery App',
  meta: [
    { name: 'description', content: 'Аналітичні графіки по замовленням і транспортним засобам.' },
    { name: 'keywords', content: 'аналітика, графіки, замовлення, транспорт' },
    { property: 'og:title', content: 'Аналітика — Delivery App' },
    { property: 'og:description', content: 'Аналітика системи доставки.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' }
  ]
})
Chart.register(...registerables)
const ordersLineRef = ref<HTMLCanvasElement | null>(null)
const ordersPieRef = ref<HTMLCanvasElement | null>(null)
const vehiclesBarRef = ref<HTMLCanvasElement | null>(null)
let ordersLine: Chart | null = null
let ordersPie: Chart | null = null
let vehiclesBar: Chart | null = null
const days = ref(14)
const data = ref<{ ordersByDay: { date: string; count: number }[]; ordersByStatus: { status: string; count: number }[]; vehiclesByStatus: { status: string; count: number }[] } | null>(null)
const load = async () => {
  const d = await $fetch('/api/admin/analytics', { query: { days: days.value } })
  data.value = d
  renderCharts()
}
onMounted(load)
const renderCharts = () => {
  if (!data.value) return
  if (ordersLine) ordersLine.destroy()
  if (ordersPie) ordersPie.destroy()
  if (vehiclesBar) vehiclesBar.destroy()
  const lineLabels = data.value.ordersByDay.map(x => x.date)
  const lineData = data.value.ordersByDay.map(x => x.count)
  ordersLine = new Chart(ordersLineRef.value!, { type: 'line', data: { labels: lineLabels, datasets: [{ label: 'Замовлення', data: lineData, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)' }] }, options: { responsive: true, maintainAspectRatio: false } })
  const pieLabels = data.value.ordersByStatus.map(x => x.status)
  const pieData = data.value.ordersByStatus.map(x => x.count)
  ordersPie = new Chart(ordersPieRef.value!, { type: 'doughnut', data: { labels: pieLabels, datasets: [{ data: pieData, backgroundColor: ['#22c55e','#3b82f6','#ef4444','#f59e0b','#a855f7','#6366f1'] }] }, options: { responsive: true, maintainAspectRatio: false } })
  const barLabels = data.value.vehiclesByStatus.map(x => x.status)
  const barData = data.value.vehiclesByStatus.map(x => x.count)
  vehiclesBar = new Chart(vehiclesBarRef.value!, { type: 'bar', data: { labels: barLabels, datasets: [{ label: 'ТЗ', data: barData, backgroundColor: '#22c55e' }] }, options: { responsive: true, maintainAspectRatio: false } })
}
const { $socket } = useNuxtApp()
onMounted(() => {
  $socket?.on('order:created', async () => { await load() })
  $socket?.on('order:status_changed', async () => { await load() })
  $socket?.on('order:assigned', async () => { await load() })
})
</script>