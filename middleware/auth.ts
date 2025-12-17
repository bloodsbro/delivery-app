import { useAuthStore } from '~/stores/auth'
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  if (!auth.user) {
    try { await auth.me() } catch {}
  }
  const requiredRoles = (to.meta?.roles as string[]) || []
  if (requiredRoles.length > 0) {
    if (!auth.user) return navigateTo('/login')
    if (!requiredRoles.includes(auth.user.role)) return navigateTo('/')
  }
})