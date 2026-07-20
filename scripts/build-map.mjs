// Genera app/components/tripMapGeo.js: contorno simplificado de Vietnam + Camboya y las
// coordenadas proyectadas de las paradas del viaje, para el mapa de referencia (TripMap.vue).
//
// Uso:  node scripts/build-map.mjs
//
// Descarga los contornos de georgique/world-geojson, los simplifica con Douglas-Peucker y los
// proyecta (equirectangular, norte arriba). El resultado es un módulo estático: NO se ejecuta en
// build ni en runtime, solo cuando hace falta regenerar la geometría. No editar tripMapGeo.js a mano.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'components', 'tripMapGeo.js')
const SRC = 'https://raw.githubusercontent.com/georgique/world-geojson/develop/countries'

// --- proyección equirectangular (norte arriba), longitud corregida por cos(lat medio) ---
const LON0 = 102.1, LAT1 = 23.6, K = Math.cos((15.95 * Math.PI) / 180), SCALE = 40
const px = (lon) => (lon - LON0) * K * SCALE
const py = (lat) => (LAT1 - lat) * SCALE

// --- Douglas-Peucker sobre lon/lat (eps en grados) ---
function perp(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy
  if (L2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}
function dp(pts, eps) {
  if (pts.length < 3) return pts
  let dmax = 0, idx = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perp(pts[i], pts[0], pts[pts.length - 1])
    if (d > dmax) { dmax = d; idx = i }
  }
  if (dmax > eps) return dp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(dp(pts.slice(idx), eps))
  return [pts[0], pts[pts.length - 1]]
}

function mainRing(gj) {
  const g = gj.features ? gj.features[0].geometry : gj.geometry || gj
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
  let best = null, bestN = -1
  for (const p of polys) if (p[0].length > bestN) { bestN = p[0].length; best = p[0] }
  return best
}

async function pathFor(country, eps) {
  const res = await fetch(`${SRC}/${country}.json`)
  if (!res.ok) throw new Error(`${country}: HTTP ${res.status}`)
  const ring = dp(mainRing(await res.json()), eps)
  const d = ring.map(([lon, lat], i) => `${i ? 'L' : 'M'}${px(lon).toFixed(1)},${py(lat).toFixed(1)}`).join(' ') + ' Z'
  return { d, ring, n: ring.length }
}

const vn = await pathFor('vietnam', 0.05)
const kh = await pathFor('cambodia', 0.045)

// --- paradas y referencias [lon, lat] ---
const raw = {
  hanoi: [105.8542, 21.0278], ninhBinh: [105.945, 20.25], haGiang: [104.9784, 22.8233],
  quanBa: [104.98, 23.05], yenMinh: [105.15, 23.10], dongVan: [105.3636, 23.278],
  meoVac: [105.41, 23.16], siemReap: [103.856, 13.3671], phnomPenh: [104.916, 11.5564],
  saigon: [106.6297, 10.8231], daNang: [108.2022, 16.0544],
}
const cities = {}
for (const [k, [lon, lat]] of Object.entries(raw)) cities[k] = { x: +px(lon).toFixed(1), y: +py(lat).toFixed(1) }

// --- viewBox = bbox de la tierra + margen ---
const pts = [...vn.ring, ...kh.ring].map(([lon, lat]) => [px(lon), py(lat)])
const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), M = 16
const vb = [Math.min(...xs) - M, Math.min(...ys) - M, Math.max(...xs) - Math.min(...xs) + 2 * M, Math.max(...ys) - Math.min(...ys) + 2 * M]
const viewBox = vb.map((n) => n.toFixed(1)).join(' ')

writeFileSync(OUT, `// Geometría del mapa del viaje — GENERADA por scripts/build-map.mjs (node scripts/build-map.mjs).
// Fuente: georgique/world-geojson, simplificada con Douglas-Peucker y proyectada (equirectangular,
// norte arriba). Estática: no requiere red en build ni en runtime. No editar a mano.
export const viewBox = ${JSON.stringify(viewBox)}
export const vnPath = ${JSON.stringify(vn.d)}
export const khPath = ${JSON.stringify(kh.d)}
export const cities = ${JSON.stringify(cities)}
`)
console.log(`tripMapGeo.js regenerado · VN ${vn.n} pts · KH ${kh.n} pts · viewBox ${viewBox}`)
