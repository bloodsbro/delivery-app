<template>
  <div :class="['min-h-screen font-sans antialiased text-gray-100', 'flex flex-col', themeClass, winterClass]">
    <header class="bg-gray-900 text-gray-100 shadow-md">
      <nav class="container mx-auto px-4 py-4 flex justify-between items-center">
        <NuxtLink to="/" class="text-2xl font-extrabold tracking-tight hover:text-gray-300 transition-colors duration-200">
          📦 Delivery App
        </NuxtLink>
        <button class="md:hidden inline-flex items-center justify-center rounded-md px-3 py-2 bg-gray-800 text-gray-100 hover:bg-gray-700" aria-label="Меню" @click="mobileOpen = !mobileOpen">
          ☰
        </button>
        <ul class="hidden md:flex space-x-6 text-lg items-center header-nav">
          <li>
            <NuxtLink to="/" class="transition-colors duration-200 py-2 px-3 rounded-md hover:bg-gray-800 hover:text-gray-200">Відстеження</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/orders/create" class="transition-colors duration-200 py-2 px-3 rounded-md hover:bg-gray-800 hover:text-gray-200">Створити замовлення</NuxtLink>
          </li>
          <li v-if="auth.user?.role === 'customer'">
            <NuxtLink to="/my-orders" class="transition-colors duration-200 py-2 px-3 rounded-md hover:bg-gray-800 hover:text-gray-200">Мої замовлення</NuxtLink>
          </li>
          <li v-if="auth.user?.role === 'admin'">
            <NuxtLink to="/vehicles" class="transition-colors duration-200 py-2 px-3 rounded-md hover:bg-gray-800 hover:text-gray-200">Транспортні засоби</NuxtLink>
          </li>
          <li v-if="auth.user">
            <NuxtLink to="/settings" class="transition-colors duration-200 py-2 px-3 rounded-md hover:bg-gray-800 hover:text-gray-200">Налаштування</NuxtLink>
          </li>
          <li v-if="auth.user?.role === 'admin'">
            <NuxtLink to="/admin" class="transition-colors duration-200 py-2 px-3 rounded-md hover:bg-gray-800 hover:text-gray-200">Адміністрування</NuxtLink>
          </li>
          <li v-if="auth.user?.role === 'courier'">
            <NuxtLink to="/courier" class="transition-colors duration-200 py-2 px-3 rounded-md hover:bg-gray-800 hover:text-gray-200">Кур'єр</NuxtLink>
          </li>
          <li v-if="!auth.user">
            <NuxtLink to="/login" class="transition-colors duration-200 py-2 px-3 rounded-md hover:bg-gray-800 hover:text-gray-200">Вхід</NuxtLink>
          </li>
          <li v-if="auth.user">
            <div class="relative">
              <button class="relative py-2 px-3 rounded-md bg-gray-800 hover:bg-gray-700" @click="notifOpen = !notifOpen">
                🔔
                <span v-if="notif.unreadCount" class="absolute -top-1 -right-1 text-xs bg-red-600 text-white rounded-full px-1">{{ notif.unreadCount }}</span>
              </button>
              <div v-if="notifOpen" class="absolute right-0 mt-2 w-72 bg-gray-900 border border-gray-800 rounded shadow-lg z-1000">
                <div class="p-2 text-sm text-gray-400">Сповіщення</div>
                <div v-if="notif.items.length === 0" class="p-3 text-sm text-gray-500">Немає сповіщень</div>
                <div v-else class="max-h-64 overflow-auto">
                  <div v-for="n in notif.items" :key="n.id" class="p-3 border-b border-gray-800">
                    <div class="text-sm font-semibold">{{ n.title }}</div>
                    <div class="text-xs text-gray-400">{{ n.content }}</div>
                    <div class="mt-2 flex justify-end">
                      <button v-if="!n.is_read" class="text-xs px-2 py-1 bg-blue-600 text-white rounded" @click="markRead(n.id)">Позначити прочитаним</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
          <li>
            <button class="py-2 px-3 rounded-md bg-gray-800 hover:bg-gray-700" @click="toggleTheme">🌓</button>
          </li>
          <li>
            <button class="py-2 px-3 rounded-md bg-gray-800 hover:bg-gray-700" @click="toggleWinter">❄️</button>
          </li>
          <li v-if="auth.user">
            <button class="w-full py-2 px-3 rounded-md bg-red-600 hover:bg-red-700 text-white" @click="logout">Вийти</button>
          </li>
        </ul>
      </nav>
      <div v-if="mobileOpen" class="md:hidden">
        <ul class="absolute top-16 left-0 w-full px-4 pb-4 space-y-2 text-lg bg-gray-900 shadow-lg z-1000">
          <li>
            <NuxtLink to="/" class="block transition-colors duration-200 py-2 px-3 rounded-md bg-gray-900 hover:bg-gray-800" @click="mobileOpen=false">Відстеження</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/orders/create" class="block transition-colors duration-200 py-2 px-3 rounded-md bg-gray-900 hover:bg-gray-800" @click="mobileOpen=false">Створити замовлення</NuxtLink>
          </li>
          <li v-if="auth.user?.role === 'customer'">
            <NuxtLink to="/my-orders" class="block transition-colors duration-200 py-2 px-3 rounded-md bg-gray-900 hover:bg-gray-800" @click="mobileOpen=false">Мої замовлення</NuxtLink>
          </li>
          <li v-if="auth.user?.role === 'admin'">
            <NuxtLink to="/vehicles" class="block transition-colors duration-200 py-2 px-3 rounded-md bg-gray-900 hover:bg-gray-800" @click="mobileOpen=false">Транспортні засоби</NuxtLink>
          </li>
          <li v-if="auth.user">
            <NuxtLink to="/settings" class="block transition-colors duration-200 py-2 px-3 rounded-md bg-gray-900 hover:bg-gray-800" @click="mobileOpen=false">Налаштування</NuxtLink>
          </li>
          <li v-if="auth.user?.role === 'admin'">
            <NuxtLink to="/admin" class="block transition-colors duration-200 py-2 px-3 rounded-md bg-gray-900 hover:bg-gray-800" @click="mobileOpen=false">Адміністрування</NuxtLink>
          </li>
          <li v-if="auth.user?.role === 'courier'">
            <NuxtLink to="/courier" class="block transition-colors duration-200 py-2 px-3 rounded-md bg-gray-900 hover:bg-gray-800" @click="mobileOpen=false">Кур'єр</NuxtLink>
          </li>
          <li v-if="!auth.user">
            <NuxtLink to="/login" class="block transition-colors duration-200 py-2 px-3 rounded-md bg-gray-900 hover:bg-gray-800" @click="mobileOpen=false">Вхід</NuxtLink>
          </li>
          <li v-else>
            <button class="w-full py-2 px-3 rounded-md bg-red-600 hover:bg-red-700 text-white" @click="logout">Вийти</button>
          </li>
        </ul>
      </div>
    </header>
    <main class="py-8 relative flex-1">
      <Transition name="fade" mode="out-in">
        <div :key="route.fullPath">
          <slot />
        </div>
      </Transition>
      <div v-if="isNavigating" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000]">
        <div class="flex flex-col items-center gap-3 p-6 rounded-lg bg-gray-900 border border-gray-800 shadow-xl">
          <svg class="animate-spin h-8 w-8 text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a 8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
          <div class="text-sm text-gray-300">Завантаження...</div>
        </div>
      </div>
    </main>
    <div v-if="winter" class="pointer-events-none fixed inset-0 z-[100] winter-snow"/>
    <footer class="bg-gray-900 text-gray-300 py-8 mt-10">
      <div class="container mx-auto text-sm grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
        <div>
          <div class="text-lg font-bold">ТОВ "Delivery App"</div>
          <div class="mt-2">ЄДРПОУ: 12345678</div>
          <div class="mt-1">ІПН: 1234567890</div>
          <div class="mt-1">Адреса: м. Київ, вул. Хрещатик, 1</div>
          <div class="mt-1">&copy; 2025 Delivery App</div>
        </div>
        <div>
          <div class="text-lg font-bold">Контакти</div>
          <ul class="mt-2 space-y-1">
            <li><a href="tel:+380501234567" class="underline hover:text-gray-200">+380 (50) 123-45-67</a></li>
            <li><a href="tel:+380677654321" class="underline hover:text-gray-200">+380 (67) 765-43-21</a></li>
            <li><a href="mailto:support@delivery.app" class="underline hover:text-gray-200">support@delivery.app</a></li>
          </ul>
          <div class="mt-3 flex gap-2">
            <button class="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700" @click="contactsOpen=true">Зворотній зв'язок</button>
          </div>
        </div>
        <div>
          <div class="text-lg font-bold">Документи</div>
          <ul class="mt-2 space-y-2">
            <li><button class="underline hover:text-gray-200" @click="policyOpen=true">Політика конфедеційності</button></li>
            <li><button class="underline hover:text-gray-200" @click="termsOpen=true">Умови користування</button></li>
          </ul>
          <div class="mt-4 flex gap-2">
            <button class="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700" @click="toggleWinter">❄️ Зимова тема</button>
            <button class="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700" @click="toggleTheme">🌓 Тема</button>
          </div>
        </div>
      </div>
    </footer>

    <div v-if="policyOpen" class="fixed inset-0 z-[3000] bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div class="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-lg p-6 text-gray-100">
        <div class="text-lg font-bold mb-3">Політика конфедеційності</div>
        <div class="text-sm text-gray-300">Ми поважаємо вашу приватність та обробляємо дані відповідно до чинного законодавства.</div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700" @click="policyOpen=false">Закрити</button>
        </div>
      </div>
    </div>

    <div v-if="contactsOpen" class="fixed inset-0 z-[3000] bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div class="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-lg p-6 text-gray-100">
        <div class="text-lg font-bold mb-3">Контакти</div>
        <div class="text-sm text-gray-300">Напишіть нам на support@delivery.app або зателефонуйте за вказаними номерами.</div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700" @click="contactsOpen=false">Закрити</button>
        </div>
      </div>
    </div>

    <div v-if="termsOpen" class="fixed inset-0 z-[3000] bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div class="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-lg p-6 text-gray-100">
        <div class="text-lg font-bold mb-3">Умови користування</div>
        <div class="text-sm text-gray-300">Користуючись сайтом, ви погоджуєтесь з нашими умовами надання послуг.</div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700" @click="termsOpen=false">Закрити</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useNotificationStore } from '~/stores/notifications'
const auth = useAuthStore()
const notif = useNotificationStore()
const logout = async () => { await auth.logout(); navigateTo('/login') }
onMounted(async () => { if (!auth.user) { try { await auth.me() } catch {} } })
const mobileOpen = ref(false)
const notifOpen = ref(false)
const markRead = async (id: string) => { await notif.markRead(id) }
watch(() => auth.user?.id, async (id) => { if (id) { await notif.fetch(true) } else { notif.items = []; notif.unreadCount = 0 } })
const isNavigating = ref(false)
const router = useRouter()
const route = useRoute()
router.beforeEach((_to, _from, next) => { isNavigating.value = true; next() })
router.afterEach(() => { setTimeout(() => { isNavigating.value = false }, 150) })
const theme = ref<'dark'|'light'>('dark')
const winter = ref(false)
const themeClass = computed(() => theme.value === 'light' ? 'theme-light bg-gray-100 text-gray-900' : 'theme-dark bg-gray-950 text-gray-100')
const winterClass = computed(() => winter.value ? 'winter-theme' : '')
const toggleTheme = () => { theme.value = theme.value === 'dark' ? 'light' : 'dark'; localStorage.setItem('app-theme', theme.value) }
const toggleWinter = () => { winter.value = !winter.value; localStorage.setItem('app-winter', winter.value ? '1' : '0') }
const policyOpen = ref(false)
const contactsOpen = ref(false)
const termsOpen = ref(false)
onMounted(() => {
  const savedTheme = localStorage.getItem('app-theme')
  if (savedTheme === 'light' || savedTheme === 'dark') theme.value = savedTheme as any
  winter.value = localStorage.getItem('app-winter') === '1'
})
</script>
<style>
main {
  align-content: center;
}

.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.theme-light header { background-color: #f7f7f7; color: #111; }
.theme-light footer { background-color: #f7f7f7; color: #111; }
.theme-light .bg-gray-950 { background-color: #f9fafb; }
.theme-light .bg-gray-900 { background-color: #ffffff; }
.theme-light .bg-gray-800 { background-color: #ffffff; }
.theme-light .bg-gray-700 { background-color: #ffffff; }
.theme-light .border-gray-800 { border-color: #dddddd; }
.theme-light .border-gray-700 { border-color: #dddddd; }
.theme-light .hover\:bg-gray-800:hover { background-color: #ececec; }
.theme-light .hover\:bg-gray-700:hover { background-color: #ececec; }
.theme-light .text-gray-100 { color: #111; }
.theme-light .text-gray-200 { color: #222; }
.theme-light .text-gray-300 { color: #333; }
.theme-light .text-gray-400 { color: #555; }
.theme-light .text-gray-500 { color: #777; }
.theme-light .header-nav a { color: #111; }
.theme-light .header-nav a:hover { background-color: #ececec; color: #000; }
.theme-light .header-nav button { background-color: #efefef; color: #111; }
.theme-light .header-nav button:hover { background-color: #e2e2e2; }

.winter-theme header, .winter-theme footer { background-image: linear-gradient(180deg, rgba(0,50,100,0.15), rgba(0,0,0,0)); }
.winter-snow { background-image: radial-gradient(white 1px, transparent 1px), radial-gradient(white 1px, transparent 1px); background-size: 20px 20px, 30px 30px; background-position: 0 0, 10px 10px; animation: snow 12s linear infinite; opacity: 0.18; }
@keyframes snow { from { background-position: 0 0, 10px 10px; } to { background-position: 0 1000px, 10px 1010px; } }
/* Winter accents */
.winter-theme .bg-blue-600 { background-color: #3ba4e6; }
.winter-theme .hover\:bg-blue-700:hover { background-color: #2f8fcd; }
.winter-theme .text-indigo-400 { color: #8fd0ff; }
.winter-theme .shadow-xl { box-shadow: 0 10px 25px rgba(0, 120, 200, 0.15); }
</style>
