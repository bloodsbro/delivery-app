<template>
  <div class="container mx-auto p-4 text-gray-100">
    <h1 class="text-2xl font-bold mb-6">Журнали подій</h1>
    <div class="mb-4 flex items-center gap-2">
      <input v-model.number="limit" type="number" min="1" max="500" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 w-24" >
      <button class="px-3 py-2 bg-blue-600 text-white rounded" @click="load">Оновити</button>
    </div>
    <div class="border border-gray-800 rounded overflow-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-900">
          <tr>
            <th class="p-2 text-left">Час</th>
            <th class="p-2 text-left">Дія</th>
            <th class="p-2 text-left">Сутність</th>
            <th class="p-2 text-left">Дані</th>
            <th class="p-2 text-left">IP</th>
            <th class="p-2 text-left">UA</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in logs" :key="l.id" class="border-t border-gray-800">
            <td class="p-2">{{ new Date(l.created_at).toLocaleString() }}</td>
            <td class="p-2">{{ l.action }}</td>
            <td class="p-2">{{ l.entity_type }} {{ l.entity_id }}</td>
            <td class="p-2"><pre class="whitespace-pre-wrap">{{ format(l.data) }}</pre></td>
            <td class="p-2">{{ l.ip_address }}</td>
            <td class="p-2 truncate max-w-[200px]">{{ l.user_agent }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Log } from '@prisma/client'
import { PERMISSIONS } from '~/utils/permissions'

definePageMeta({ middleware: 'auth', permissions: [PERMISSIONS.VIEW_LOGS] })
useHead({
  title: 'Журнали подій — Delivery App',
  meta: [
    { name: 'description', content: 'Перегляд системних журналів подій для адміністратора.' },
    { name: 'keywords', content: 'логи, адміністрування, аудит' },
    { property: 'og:title', content: 'Журнали подій — Delivery App' },
    { property: 'og:description', content: 'Аудит подій у системі доставки.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' }
  ]
})
const logs = ref<Log[]>([])
const limit = ref(100)
const load = async () => { const { data } = await useFetch<Log[]>('/api/admin/logs', { query: { limit: limit.value } }); logs.value = data.value || [] }
onMounted(load)
const format = (d: Log['data']) => { try { return JSON.stringify(d ?? {}, null, 2) } catch { return String(d) }
}
</script>