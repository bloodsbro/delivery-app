<template>
  <div ref="el" class="w-full h-64 rounded border border-gray-800 bg-gray-800 mt-16 mb-16"/>
</template>
<script setup lang="ts">
const el = ref<HTMLElement | null>(null)
const emit = defineEmits(['marker-click'])
const props = defineProps<{ points?: { lat: number; lng: number }[], markers?: { lat: number; lng: number; id?: string; label?: string; info?: string }[], center?: { lat: number; lng: number } }>()
let map: any
let poly: any
let mkInstances: any[] = []

const ensureLeaflet = async () => {
  if (typeof window === 'undefined') return
  if ((window as any).L) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
  document.head.appendChild(link)
  await new Promise(r => setTimeout(r, 10))
  const script = document.createElement('script')
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
  script.defer = true
  document.body.appendChild(script)
  await new Promise<void>(resolve => { script.onload = () => resolve() })
}

const render = async () => {
  await ensureLeaflet()
  const L = (window as any).L
  if (!el.value) return
  if (!map) {
    const firstPoint = (props.points && props.points[0]) || (props.markers && props.markers[0])
    map = L.map(el.value).setView([props.center?.lat ?? firstPoint?.lat ?? 50, props.center?.lng ?? firstPoint?.lng ?? 30], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map)
  }
  mkInstances.forEach(m => m.remove())
  mkInstances = []
  const isValid = (p: any) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180
  const pts = (props.points || []).filter(isValid)
  const baseMarkers = (props.markers || []).filter(isValid)
  const markers = baseMarkers.length ? baseMarkers : (pts.length ? [pts[0], pts[pts.length - 1]].filter(isValid) : [])
  markers.forEach((m: any) => {
    const mk = L.marker([m.lat, m.lng]).addTo(map)
    mkInstances.push(mk)
    mk.on('click', () => emit('marker-click', m))
  })
  if (poly) { try { poly.remove() } catch { /* empty */ } }
  if (pts.length > 1) {
    try {
      poly = L.polyline(pts.map(p => [p.lat, p.lng]), { color: 'blue' }).addTo(map)
      const bounds = poly.getBounds()
      if (bounds && bounds.isValid && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] })
      }
    } catch {
      /* empty */
    }
  }
}

onMounted(render)
watch(() => [props.points, props.markers], render, { deep: true })
</script>
