import { defineStore } from 'pinia'

interface NotificationItem {
  id: string
  title: string
  content: string
  is_read: boolean
  created_at: string
}

export const useNotificationStore = defineStore('notifications', {
  state: () => ({ items: [] as NotificationItem[], unreadCount: 0 }),
  actions: {
    async fetch(unreadOnly = true) {
      const { data } = await useFetch<NotificationItem[]>(`/api/notifications`, { query: { unread: unreadOnly } })
      const list = data.value || []
      this.items = list
      this.unreadCount = list.filter(n => !n.is_read).length
    },
    async markRead(id: string) {
      await useFetch(`/api/notifications/${id}`, { method: 'PUT' })
      this.items = this.items.map(n => n.id === id ? { ...n, is_read: true } : n)
      this.unreadCount = this.items.filter(n => !n.is_read).length
    }
  }
})