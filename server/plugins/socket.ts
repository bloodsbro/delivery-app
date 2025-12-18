import { Server } from 'socket.io'
import { createServer } from 'http'

let io: Server | null = null

export default defineNitroPlugin((nitroApp) => {
  if (io) return
  const config = useRuntimeConfig()
  const port = Number(config.socketPort || 4000)
  const srv = createServer()
  io = new Server(srv, { cors: { origin: '*', methods: ['GET','POST'] } })
  srv.listen(port)
  const broadcast = {
    orderCreated(payload: unknown) { io?.emit('order:created', payload) },
    orderStatusChanged(payload: unknown) { io?.emit('order:status_changed', payload) },
    orderAssigned(payload: unknown) { io?.emit('order:assigned', payload) },
    courierLocationUpdated(payload: unknown) { io?.emit('courier:location', payload) },
  };
  nitroApp.broadcast = broadcast
  nitroApp.hooks.hook('close', () => { io?.close(); io = null })
})