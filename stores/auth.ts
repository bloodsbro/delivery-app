import { defineStore } from 'pinia'

interface User {
  id: string
  email: string
  role: string
  permissions: string[]
  firstName?: string
  lastName?: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null as User | null, loading: false }),
  getters: {
    hasPermission: (state) => (permission: string) => {
      if (!state.user) return false
      if (state.user.role === 'admin') return true
      const perms = state.user.permissions || []
      return perms.includes(permission) || perms.includes('*')
    }
  },
  actions: {
    async me() {
      const headers = useRequestHeaders(['cookie'])
      const data = await $fetch<User>('/api/auth/me', { headers })
      this.user = data || null
    },
    async login(email: string, password: string, captchaToken?: string) {
      const data = await $fetch<User>('/api/auth/login', { method: 'POST', body: { email, password, captchaToken } })
      this.user = data || null
    },
    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' })
      this.user = null
    },
    async adminCreateUser(payload: { email: string; password: string; firstName?: string; lastName?: string; phone?: string; role?: string }) {
      const data = await $fetch<User>('/api/admin/users', { method: 'POST', body: payload })
      return data || null
    }
  }
})