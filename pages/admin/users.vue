<template>
  <div class="container mx-auto p-4 max-w-2xl text-gray-100">
    <h1 class="text-2xl font-bold mb-6">Користувачі</h1>
    <form class="grid grid-cols-1 gap-3 mb-6" @submit.prevent="create">
      <input v-model="form.email" type="email" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Email" required />
      <input v-model="form.password" type="password" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Пароль" required />
      <input v-model="form.firstName" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Ім'я" />
      <input v-model="form.lastName" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Прізвище" />
      <input v-model="form.phone" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Телефон" />
      <select v-model="form.role" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-2">
        <option value="customer">Клієнт</option>
        <option value="courier">Кур'єр</option>
        <option value="admin">Адмін</option>
      </select>
      <button type="submit" class="bg-green-600 text-white p-3 rounded">Створити</button>
    </form>
    <div class="border border-gray-800 rounded p-4">
      <h2 class="text-lg font-semibold mb-3">Список</h2>
      <div v-for="u in users" :key="u.id" class="flex justify-between border-b border-gray-800 py-2">
        <span>{{ u.email }} · {{ u.role }}</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
definePageMeta({ middleware: 'auth', roles: ['admin'] })
useHead({
  title: 'Користувачі — Delivery App',
  meta: [
    { name: 'description', content: 'Створення та перегляд користувачів системи.' },
    { name: 'keywords', content: 'користувачі, адміністрування, ролі' },
    { property: 'og:title', content: 'Користувачі — Delivery App' },
    { property: 'og:description', content: 'Адміністрування користувачів у системі доставки.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' }
  ]
})
const auth = useAuthStore()
const form = reactive({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'customer' })
const users = ref<any[]>([])
const create = async () => {
  await auth.adminCreateUser(form)
  await load()
}
const load = async () => {
  const { data } = await useFetch<any[]>('/api/admin/users')
  users.value = data.value || []
}
onMounted(load)
</script>