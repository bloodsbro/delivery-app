<template>
  <div class="container mx-auto p-4 text-gray-100">
    <h1 class="text-2xl font-bold mb-6">Розподіл замовлень</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="border border-gray-800 rounded p-4">
        <h2 class="text-lg font-semibold mb-3">Нерозподілені замовлення</h2>
        <div v-for="o in orders" :key="o.id" class="border-b border-gray-800 py-2 flex justify-between">
          <span>#{{ o.id.slice(0,8) }} · {{ o.customerName }}</span>
          <select v-model="assign[o.id]" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-1">
            <option v-for="c in couriers" :key="c.id" :value="c.id">{{ c.user?.first_name }} {{ c.user?.last_name }}</option>
          </select>
          <button class="bg-blue-600 text-white px-3 py-1 rounded" @click="doAssign(o.id)">Призначити</button>
        </div>
      </div>
      <div class="border border-gray-800 rounded p-4">
        <h2 class="text-lg font-semibold mb-3">Кур'єри</h2>
        <div v-for="c in couriers" :key="c.id" class="border-b border-gray-800 py-2">{{ c.user?.first_name }} {{ c.user?.last_name }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Order, Prisma } from '@prisma/client'
import { PERMISSIONS } from '~/utils/permissions'

type CourierWithUser = Prisma.CourierGetPayload<{
  include: { user: true }
}>

type OrderWithRelations = Order & { customerName: string };

definePageMeta({ middleware: 'auth', permissions: [PERMISSIONS.MANAGE_ORDERS] })
useHead({
  title: 'Розподіл замовлень — Delivery App',
  meta: [
    { name: 'description', content: 'Призначення замовлень кур’єрам та керування розподілом.' },
    { name: 'keywords', content: 'розподіл, кур’єри, замовлення' },
    { property: 'og:title', content: 'Розподіл замовлень — Delivery App' },
    { property: 'og:description', content: 'Інструмент призначення замовлень кур’єрам.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' }
  ]
})
const orders = ref<OrderWithRelations[]>([])
const couriers = ref<CourierWithUser[]>([])
const assign = reactive<Record<string,string>>({})
const load = async () => {
  const o = await $fetch<OrderWithRelations[]>('/api/admin/orders/unassigned')
  orders.value = o || []
  const c = await $fetch<CourierWithUser[]>('/api/couriers')
  couriers.value = c || []
}
const doAssign = async (orderId: string) => {
  const courierId = assign[orderId]
  if (!courierId) return
  await $fetch('/api/admin/assign', { method: 'POST', body: { orderId, courierId } })
  await load()
}
onMounted(load)
</script>