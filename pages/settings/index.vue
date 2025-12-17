<template>
  <div class="container mx-auto p-4 max-w-md text-gray-100">
    <h1 class="text-2xl font-bold mb-6">Налаштування профілю</h1>
    <div v-if="!auth.user" class="text-gray-400">Потрібно увійти</div>
    <form v-else class="space-y-3" @submit.prevent="save">
      <input v-model="firstName" class="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Ім'я" />
      <input v-model="lastName" class="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Прізвище" />
      <input v-model="phone" class="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Телефон" />
      <input v-model="password" type="password" class="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Новий пароль" />
      <button class="w-full bg-green-600 text-white p-3 rounded">Зберегти</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
definePageMeta({ middleware: 'auth' })
useHead({
  title: 'Налаштування профілю — Delivery App',
  meta: [
    { name: 'description', content: 'Оновлення імені, телефону та паролю вашого профілю.' },
    { name: 'keywords', content: 'профіль, налаштування, безпека' },
    { property: 'og:title', content: 'Налаштування профілю — Delivery App' },
    { property: 'og:description', content: 'Керування особистими даними у системі.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' }
  ]
})
const auth = useAuthStore()
const firstName = ref(auth.user?.firstName || '')
const lastName = ref(auth.user?.lastName || '')
const phone = ref('')
const password = ref('')
const save = async () => {
  await useFetch('/api/profile', { method: 'PUT', body: { firstName: firstName.value, lastName: lastName.value, phone: phone.value, password: password.value } })
  await auth.me()
}
</script>
