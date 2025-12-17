<template>
  <div class="container mx-auto p-4">
    <div v-if="loading" class="text-center text-gray-400 p-8 border border-gray-800 rounded-lg bg-gray-900 shadow-sm">Завантаження...</div>
    <h1 class="text-2xl font-bold mb-6 text-gray-100">Мої замовлення</h1>
    <OrderList :is-all-orders="true" :orders="orderStore.orders" title="Усі мої замовлення" />
  </div>
</template>

<script setup lang="ts">
import { useOrderStore } from '~/stores/orders';
import OrderList from '~/components/OrderList.vue';
definePageMeta({ middleware: 'auth', roles: ['customer'] })
useHead({
  title: 'Мої замовлення — Delivery App',
  meta: [
    { name: 'description', content: 'Перегляд історії замовлень клієнта та їхніх статусів.' },
    { name: 'keywords', content: 'замовлення, історія, клієнт' },
    { property: 'og:title', content: 'Мої замовлення — Delivery App' },
    { property: 'og:description', content: 'Ваші замовлення та актуальні статуси.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' }
  ]
})

const orderStore = useOrderStore();
const loading = ref(true)

onMounted(async () => {
  const { data } = await useFetch('/api/orders/my')
  orderStore.orders = data.value || []
  loading.value = false
})
</script>
