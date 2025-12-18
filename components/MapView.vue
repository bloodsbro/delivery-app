<template>
  <div ref="wrapper" class="relative w-full h-64 mt-16 mb-16 rounded border border-gray-800 bg-gray-800 group">
    <div ref="el" class="w-full h-full rounded"/>
    <button 
      class="absolute top-2 right-2 z-[1000] bg-gray-800 text-white p-2 rounded shadow-lg border border-gray-700 hover:bg-gray-700 transition-opacity opacity-50 group-hover:opacity-100"
      title="На весь екран" 
      @click="toggleFullscreen"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
      </svg>
    </button>
  </div>
</template>
<script setup lang="ts">
import type * as L from 'leaflet';

const el = ref<HTMLElement | null>(null)
const wrapper = ref<HTMLElement | null>(null)
const toggleFullscreen = async () => {
  if (!document.fullscreenElement) {
    await wrapper.value?.requestFullscreen()
  } else {
    await document.exitFullscreen()
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', () => {
    setTimeout(() => { map?.invalidateSize() }, 100)
  })
})

const emit = defineEmits(['marker-click'])
const props = defineProps<{ points?: { lat: number; lng: number }[], markers?: { lat: number; lng: number; id?: string; label?: string; info?: string }[], center?: { lat: number; lng: number } }>()
let map: L.Map
let poly: L.Polyline | null = null
let mkInstances: L.Marker[] = []

const ensureLeaflet = async () => {
  if (typeof window === 'undefined') return
  if (window.L) return
  
  const existingScript = document.querySelector('script[src*="leaflet.js"]')
  if (existingScript) {
    await new Promise<void>(resolve => {
      if (window.L) return resolve()
      const interval = setInterval(() => {
        if (window.L) {
          clearInterval(interval)
          resolve()
        }
      }, 50)
    })
    return
  }

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
  document.head.appendChild(link)
  
  const script = document.createElement('script')
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
  script.defer = true
  document.body.appendChild(script)
  await new Promise<void>(resolve => { script.onload = () => resolve() })
}

const render = async () => {
  await ensureLeaflet()
  const L = window.L
  if (!L || !el.value) return
  
  if (!map) {
    // Double check if map is already initialized on this element to avoid error
    // @ts-expect-error: Property '_leaflet_id' does not exist on type 'HTMLElement'.
    if (el.value._leaflet_id) return 

    const firstPoint = (props.points && props.points[0]) || (props.markers && props.markers[0])
    map = L.map(el.value).setView([props.center?.lat ?? firstPoint?.lat ?? 50, props.center?.lng ?? firstPoint?.lng ?? 30], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map)
  }
  
  // Clean up existing layers
  mkInstances.forEach(m => m.remove())
  mkInstances = []
  if (poly) { 
    try { poly.remove() } catch { /* empty */ } 
    poly = null
  }

  const isValid = (p: { lat: number; lng: number }) => 
    p && typeof p.lat === 'number' && typeof p.lng === 'number' && 
    Number.isFinite(p.lat) && Number.isFinite(p.lng)

  const pts = (props.points || []).filter(isValid)
  const baseMarkers = (props.markers || []).filter(isValid)
  
  // Create markers
  baseMarkers.forEach((m: { lat: number; lng: number; id?: string; label?: string; info?: string }) => {
    try {
      const mk = L.marker([m.lat, m.lng]).addTo(map)
      if (m.label) mk.bindTooltip(m.label, { permanent: true, direction: 'top' })
      mk.on('click', () => emit('marker-click', m))
      mkInstances.push(mk)
    } catch (e) { console.error('Error adding marker:', e) }
  })

  // Create polyline
  if (pts.length > 1) {
    try {
      const latlngs = pts.map(p => [p.lat, p.lng]) as [number, number][]
      poly = L.polyline(latlngs, { color: 'blue' }).addTo(map)
      const bounds = poly.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    } catch (e) {
      console.error('Error creating polyline:', e)
    }
  }
}

onMounted(render)
watch(() => [props.points, props.markers], render, { deep: true })
</script>
