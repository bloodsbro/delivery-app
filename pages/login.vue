<template>
  <div class="container mx-auto p-4 max-w-md text-gray-100">
    <h1 class="text-2xl font-bold mb-6">Вхід</h1>
    <p v-if="error" class="text-center bg-red-600">{{ error }}</p>
    <form class="space-y-4" @submit.prevent="submit">
      <input v-model="email" type="email" class="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Email" required >
      <input v-model="password" type="password" class="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Пароль" required >
      
      <div v-if="siteKey" ref="recaptchaContainer" class="g-recaptcha" :data-sitekey="siteKey"/>
      
      <button type="submit" class="w-full bg-blue-600 text-white p-3 rounded">Увійти</button>
    </form>
    <div class="mt-4 p-3 border border-gray-800 rounded bg-gray-900 text-sm text-gray-400">
      <table class="w-full text-center table-auto">
        <caption class="caption-top">
          Тестові дані
        </caption>
        <thead>
          <tr>
            <th>Роль</th>
            <th>Email</th>
            <th>Пароль</th>
            <th>Дія</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cred in credentials" :key="cred.email">
            <td>{{ cred.role === 'admin' ? 'Адмін' : (cred.role === 'courier' ? 'Кур\'єр' : 'Клієнт') }}</td>
            <td><code>{{ cred.email }}</code></td>
            <td><code>{{ cred.password }}</code></td>
            <td><button class="px-2 py-1 rounded bg-green-600 text-white" @click="loginWith(cred.email, cred.password)">вхід</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  </template>
<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('');
const config = useRuntimeConfig()
const siteKey = config.public.recaptchaSiteKey

useHead({
  title: 'Вхід — Delivery App',
  meta: [
    { name: 'description', content: 'Увійдіть до системи доставки для доступу до кабінету.' },
    { name: 'keywords', content: 'вхід, авторизація, доставка' },
    { property: 'og:title', content: 'Вхід — Delivery App' },
    { property: 'og:description', content: 'Авторизація користувача у Delivery App.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' }
  ],
  script: siteKey ? [
    { src: 'https://www.google.com/recaptcha/api.js', async: true, defer: true }
  ] : []
})

const submit = async () => {
  error.value = ''
  
  let token: string | undefined
  if (siteKey) {
    // @ts-expect-error grecaptcha
    token = window.grecaptcha?.getResponse()
    if (!token) {
      error.value = 'Будь ласка, пройдіть перевірку CAPTCHA'
      return
    }
  }

  try {
    await auth.login(email.value, password.value, token)
    if (auth.user?.role === 'admin') return navigateTo('/admin')
    return navigateTo('/courier')
  } catch (e: unknown) {
    // @ts-expect-error grecaptcha reset
    error.value = e?.response?.statusMessage || 'Невірний email або пароль'
    if (siteKey) {
      // @ts-expect-error grecaptcha reset
      window.grecaptcha?.reset()
    }
  }
}

const loginWith = async (e: string, p: string) => {
  email.value = e
  password.value = p
  await submit()
}

const credentials = [
  { role: 'admin', email: 'admin@delivery.com', password: 'password123' },
  { role: 'courier', email: 'courier1@delivery.com', password: 'password123' },
  { role: 'courier', email: 'courier2@delivery.com', password: 'password123' },
  { role: 'customer', email: 'customer1@example.com', password: 'password123' },
  { role: 'customer', email: 'customer2@example.com', password: 'password123' },
]
</script>
