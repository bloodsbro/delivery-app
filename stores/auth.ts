import { defineStore } from 'pinia'

interface User {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null as User | null, loading: false }),
  actions: {
    async me() {
      const { data } = await useFetch<User>('/api/auth/me')
      this.user = data.value || null
    },
    async login(email: string, password: string) {
      const { data } = await useFetch<User>('/api/auth/login', { method: 'POST', body: { email, password } })
      this.user = data.value || null
    },
    async logout() {
      await useFetch('/api/auth/logout', { method: 'POST' })
      this.user = null
    },
    async adminCreateUser(payload: { email: string; password: string; firstName?: string; lastName?: string; phone?: string; role?: string }) {
      const { data } = await useFetch('/api/admin/users', { method: 'POST', body: payload })
      return data.value
    }
  }
})