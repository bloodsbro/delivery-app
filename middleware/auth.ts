import { useAuthStore } from '~/stores/auth'
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  if (!auth.user) {
    try { 
      await auth.me() 
    } catch {
      return navigateTo('/login')
    }
  }
  const requiredRoles = (to.meta?.roles as string[]) || []
  if (requiredRoles.length > 0) {
    if (!auth.user) return navigateTo('/login')
    if (!requiredRoles.includes(auth.user.role)) return navigateTo('/')
  }

  const requiredPermissions = (to.meta?.permissions as string[]) || []
  if (requiredPermissions.length > 0) {
    if (!auth.user) return navigateTo('/login')
    const hasAll = requiredPermissions.every(p => auth.hasPermission(p))
    if (!hasAll) return navigateTo('/')
  }
})