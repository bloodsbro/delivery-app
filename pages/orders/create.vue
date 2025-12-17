<template>
  <div class="container mx-auto p-4 max-w-4xl">
    <OrderForm />
  </div>
</template>
<script setup lang="ts">
import OrderForm from '~/components/OrderForm.vue'
useHead({
  title: 'Створити замовлення — Delivery App',
  meta: [
    { name: 'description', content: 'Створення нового замовлення: товари, адреса доставки, контактні дані.' },
    { name: 'keywords', content: 'замовлення, створення, доставка' },
    { property: 'og:title', content: 'Створити замовлення — Delivery App' },
    { property: 'og:description', content: 'Оформіть доставку з деталями замовлення.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' }
  ]
})
</script>