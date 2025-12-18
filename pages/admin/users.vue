<template>
  <div class="container mx-auto p-4 max-w-4xl text-gray-100">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Управління доступом</h1>
      <div class="flex gap-2 bg-gray-800 p-1 rounded-lg">
        <button 
          :class="['px-4 py-2 rounded-md transition-colors', activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white']"
          @click="activeTab = 'users'"
        >
          Користувачі
        </button>
        <button 
          :class="['px-4 py-2 rounded-md transition-colors', activeTab === 'roles' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white']"
          @click="activeTab = 'roles'"
        >
          Ролі
        </button>
      </div>
    </div>

    <!-- USERS TAB -->
    <div v-if="activeTab === 'users'">
      <div class="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Створити користувача</h2>
        <form class="grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent="create">
          <input v-model="form.email" type="email" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Email" required >
          <input v-model="form.password" type="password" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Пароль" required >
          <input v-model="form.firstName" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Ім'я" >
          <input v-model="form.lastName" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Прізвище" >
          <input v-model="form.phone" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-2 placeholder-gray-400" placeholder="Телефон" >
          <select v-model="form.role" class="border border-gray-700 bg-gray-800 text-gray-100 rounded p-2">
            <option v-for="role in roles" :key="role.id" :value="role.name">{{ role.name }}</option>
          </select>
          <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded md:col-span-2 transition-colors">Створити</button>
        </form>
      </div>

      <div class="border border-gray-800 rounded-lg overflow-hidden">
        <table class="w-full text-left">
          <thead class="bg-gray-900 text-gray-400">
            <tr>
              <th class="p-3">Email</th>
              <th class="p-3">Ім'я</th>
              <th class="p-3">Роль</th>
              <th class="p-3">Дата реєстрації</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800">
            <tr v-for="u in users" :key="u.id" class="hover:bg-gray-800/50">
              <td class="p-3">{{ u.email }}</td>
              <td class="p-3">{{ u.first_name }} {{ u.last_name }}</td>
              <td class="p-3">
                <span class="px-2 py-1 bg-gray-800 rounded text-sm">{{ u.role.name }}</span>
              </td>
              <td class="p-3 text-gray-400 text-sm">{{ new Date(u.created_at).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ROLES TAB -->
    <div v-else>
      <div class="flex justify-end mb-4">
        <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors" @click="openRoleModal()">
          + Нова роль
        </button>
      </div>

      <div class="grid gap-4">
        <div v-for="role in roles" :key="role.id" class="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div class="flex justify-between items-start mb-2">
            <div>
              <h3 class="text-xl font-bold text-white">{{ role.name }}</h3>
              <p class="text-gray-400 text-sm">{{ role.description }}</p>
            </div>
            <div class="flex gap-2">
              <button class="text-blue-400 hover:text-blue-300" @click="openRoleModal(role)">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button class="text-red-400 hover:text-red-300" :disabled="['admin', 'customer', 'courier'].includes(role.name)" @click="deleteRole(role.id)">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
          <div class="mt-4">
            <h4 class="text-sm font-semibold text-gray-500 mb-2 uppercase">Дозволи</h4>
            <div class="flex flex-wrap gap-2">
              <span v-for="perm in parsePermissions(role.permissions)" :key="perm" class="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300">
                {{ perm }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Role Modal -->
    <UModal v-model="roleModalOpen">
      <div class="p-6 bg-gray-900 text-gray-100 rounded-lg border border-gray-700 w-full max-w-2xl">
        <h3 class="text-xl font-bold mb-4">{{ editingRole ? 'Редагувати роль' : 'Створити роль' }}</h3>
        <form class="space-y-4" @submit.prevent="saveRole">
          <div>
            <label class="block text-sm font-medium mb-1">Назва (унікальна)</label>
            <input v-model="roleForm.name" type="text" class="w-full bg-gray-800 border border-gray-700 rounded p-2" required :disabled="!!editingRole && ['admin', 'customer', 'courier'].includes(roleForm.name)">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Опис</label>
            <input v-model="roleForm.description" type="text" class="w-full bg-gray-800 border border-gray-700 rounded p-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Дозволи</label>
            <div class="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-800 rounded bg-gray-800/50">
              <label v-for="(val, key) in PERMISSIONS" :key="key" class="flex items-center gap-2 p-1 hover:bg-gray-800 rounded cursor-pointer">
                <input v-model="roleForm.permissions" type="checkbox" :value="val" class="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500">
                <span class="text-sm">{{ val }}</span>
              </label>
              <label class="flex items-center gap-2 p-1 hover:bg-gray-800 rounded cursor-pointer">
                 <input v-model="roleForm.permissions" type="checkbox" value="*" class="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500">
                 <span class="text-sm font-bold text-yellow-500">* (Super Admin)</span>
              </label>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <button type="button" class="px-4 py-2 text-gray-400 hover:text-white" @click="roleModalOpen = false">Скасувати</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">Зберегти</button>
          </div>
        </form>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Prisma } from '@prisma/client'
import { useAuthStore } from '~/stores/auth'
import { PERMISSIONS } from '~/utils/permissions'

type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>
type Role = Prisma.RoleGetPayload<{
  include: {
    users: true,
  }
}>

definePageMeta({ middleware: 'auth', permissions: [PERMISSIONS.MANAGE_USERS] })
useHead({ title: 'Управління доступом — Delivery App' })

const auth = useAuthStore()
const activeTab = ref('users')
const users = ref<UserWithRole[]>([])
const roles = ref<Role[]>([])

// User Form
const form = reactive({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'customer' })

const create = async () => {
  try {
    await auth.adminCreateUser(form)
    // Reset form
    form.email = ''
    form.password = ''
    form.firstName = ''
    form.lastName = ''
    form.phone = ''
    form.role = 'customer'
    await loadUsers()
  } catch (e: unknown) {
    if (e instanceof Error) {
      alert(e.message || 'Помилка створення користувача')
    } else {
      alert('Помилка створення користувача')
    }
  }
}

// Role Management
const roleModalOpen = ref(false)
const editingRole = ref<Role | null>(null)
const roleForm = reactive({ name: '', description: '', permissions: [] as string[] })

const openRoleModal = (role?: Role) => {
  if (role) {
    editingRole.value = role
    roleForm.name = role.name
    roleForm.description = role.description || ''
    roleForm.permissions = parsePermissions(role.permissions)
  } else {
    editingRole.value = null
    roleForm.name = ''
    roleForm.description = ''
    roleForm.permissions = []
  }
  roleModalOpen.value = true
}

const saveRole = async () => {
  try {
    if (editingRole.value) {
      await $fetch(`/api/admin/roles/${editingRole.value.id}`, { method: 'PUT', body: roleForm })
    } else {
      await $fetch('/api/admin/roles', { method: 'POST', body: roleForm })
    }
    roleModalOpen.value = false
    await loadRoles()
  } catch (e: unknown) {
    if (e instanceof Error) {
      alert(e.message || 'Помилка збереження ролі')
    } else {
      alert('Помилка збереження ролі')
    }
  }
}

const deleteRole = async (id: string) => {
  if (!confirm('Видалити роль?')) return
  try {
    await $fetch(`/api/admin/roles/${id}`, { method: 'DELETE' })
    await loadRoles()
  } catch (e: unknown) {
    if (e instanceof Error) {
      alert(e.message || 'Помилка видалення')
    } else {
      alert('Помилка видалення')
    }
  }
}

const parsePermissions = (perms: unknown): string[] => {
  if (Array.isArray(perms)) return perms
  if (typeof perms === 'string') {
    try { return JSON.parse(perms) } catch { return [] }
  }
  return []
}

// Data Loading
const loadUsers = async () => {
  const data = await $fetch<UserWithRole[]>('/api/admin/users')
  users.value = data || []
}

const loadRoles = async () => {
  const data = await $fetch<Role[]>('/api/admin/roles')
  roles.value = data || []
}

onMounted(async () => {
  await Promise.all([loadUsers(), loadRoles()])
})
</script>
