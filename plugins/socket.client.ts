import { io } from 'socket.io-client'

export default defineNuxtPlugin((nuxtApp) => {
  const url = (useRuntimeConfig().public?.socketUrl as string) ?? 'http://localhost:4000'
  const socket = io(url, { transports: ['websocket','polling'] })
  nuxtApp.provide('socket', socket)
})