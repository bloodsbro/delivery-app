<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
const auth = useAuthStore()
onServerPrefetch(async () => { if (!auth.user) { try { await auth.me() } catch {
  /* empty */
} } })
onMounted(async () => { if (!auth.user) { try { await auth.me() } catch {
  navigateTo('/login')
} } })
</script>
