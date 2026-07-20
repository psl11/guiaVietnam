<script setup>
// Mapa de referencia del viaje. SVG estático y autocontenido (sin red, offline-safe):
// la geometría de los países se genera en build-time (scratchpad/build-map.mjs) y se
// importa como datos. Hereda la paleta de laca vía var(--…), así que cambia con el tema.
import { viewBox, vnPath, khPath, cities as C } from './tripMapGeo.js'

// Ruta por tierra en orden de días: Hanói → Ninh Bình → Hà Giang → (bucle) → Hanói.
const routeKeys = ['ninhBinh', 'hanoi', 'haGiang', 'quanBa', 'yenMinh', 'dongVan', 'meoVac', 'haGiang', 'hanoi']
const routePoints = routeKeys.map((k) => `${C[k].x},${C[k].y}`).join(' ')
// Vuelo Hanói ↔ Siem Reap: arco de puntos.
const flightPath = `M${C.hanoi.x},${C.hanoi.y} Q55,250 ${C.siemReap.x},${C.siemReap.y}`

// Paradas etiquetadas (el bucle queda como trazo con 3 anclas: Hà Giang, Đồng Văn, Mèo Vạc).
const stops = [
  { key: 'hanoi', label: 'Hanói', dx: 7, dy: 4, anchor: 'start' },
  { key: 'ninhBinh', label: 'Ninh Bình', dx: 7, dy: 4, anchor: 'start' },
  { key: 'haGiang', label: 'Hà Giang', dx: -7, dy: 3, anchor: 'end' },
  { key: 'dongVan', label: 'Đồng Văn', dx: 7, dy: -3, anchor: 'start' },
  { key: 'meoVac', label: 'Mèo Vạc', dx: 7, dy: 8, anchor: 'start' },
  { key: 'siemReap', label: 'Siem Reap · Angkor', dx: 0, dy: 14, anchor: 'middle' },
]
// Referencias apagadas: lo que NO se visita, para que el vacío del sur sea información.
const refs = [
  { key: 'daNang', label: 'Đà Nẵng', dx: -7, dy: 3, anchor: 'end' },
  { key: 'saigon', label: 'Saigón', dx: 7, dy: 4, anchor: 'start' },
]
</script>

<template>
  <figure class="tripmap" aria-labelledby="tripmap-cap">
    <svg :viewBox="viewBox" role="img"
         aria-label="Mapa del viaje: todo el norte de Vietnam y el rincón de Angkor en Camboya; el centro y el sur del país quedan fuera de la ruta.">
      <!-- países -->
      <path :d="vnPath" class="land" />
      <path :d="khPath" class="land" />
      <!-- rótulos de país, al fondo -->
      <text x="282" y="330" class="country" transform="rotate(90 282 330)">VIETNAM</text>
      <text x="70" y="512" class="country">CAMBOYA</text>
      <!-- vuelo -->
      <path :d="flightPath" class="flight" />
      <!-- ruta por tierra -->
      <polyline :points="routePoints" class="route" />
      <!-- referencias no visitadas -->
      <g class="ref">
        <template v-for="r in refs" :key="r.key">
          <circle :cx="C[r.key].x" :cy="C[r.key].y" r="2.6" class="ref-dot" />
          <text :x="C[r.key].x + r.dx" :y="C[r.key].y + r.dy" :text-anchor="r.anchor" class="ref-label">{{ r.label }}</text>
        </template>
      </g>
      <!-- paradas del viaje -->
      <g class="stops">
        <template v-for="s in stops" :key="s.key">
          <circle :cx="C[s.key].x" :cy="C[s.key].y" r="3.4" class="stop-dot" />
          <text :x="C[s.key].x + s.dx" :y="C[s.key].y + s.dy" :text-anchor="s.anchor" class="stop-label">{{ s.label }}</text>
        </template>
      </g>
    </svg>
    <figcaption id="tripmap-cap" class="tripmap-cap">
      <span class="tripmap-legend"><i class="k-route" /> ruta por tierra&ensp;<i class="k-flight" /> vuelo</span>
      El viaje, de un vistazo: <strong>todo el norte de Vietnam</strong> y el rincón de Angkor.
      El centro y el sur —Đà Nẵng, Saigón— quedan fuera de la ruta.
    </figcaption>
  </figure>
</template>

<style scoped>
.tripmap {
  margin: 2.4rem auto 0.5rem;
  max-width: 330px;
  padding: 1rem 1.1rem 0.9rem;
  background: var(--bg-elev);
  border: 1px solid var(--line-soft);
  border-radius: 10px;
}
.tripmap svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.land {
  fill: var(--bg-soft);
  stroke: var(--line);
  stroke-width: 0.8;
  stroke-linejoin: round;
}
.country {
  fill: var(--ink-faint);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 3.5px;
  opacity: 0.32;
  text-anchor: middle;
}
.flight {
  fill: none;
  stroke: var(--accent-soft);
  stroke-width: 1.4;
  stroke-dasharray: 4 3.2;
  stroke-linecap: round;
  opacity: 0.85;
}
.route {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2.1;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.stop-dot {
  fill: var(--accent);
  stroke: var(--bg-elev);
  stroke-width: 1.1;
}
.stop-label {
  fill: var(--ink);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  font-weight: 600;
  paint-order: stroke;
  stroke: var(--bg-elev);
  stroke-width: 2.4;
}
.ref-dot {
  fill: none;
  stroke: var(--ink-faint);
  stroke-width: 1.2;
}
.ref-label {
  fill: var(--ink-faint);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 10px;
  font-weight: 500;
  font-style: italic;
  paint-order: stroke;
  stroke: var(--bg-elev);
  stroke-width: 2.2;
}
.tripmap-cap {
  margin-top: 0.7rem;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.72rem;
  line-height: 1.5;
  color: var(--ink-soft);
  text-align: center;
}
.tripmap-cap strong { color: var(--ink); font-weight: 600; }
.tripmap-legend {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--ink-faint);
  font-size: 0.68rem;
}
.tripmap-legend i {
  display: inline-block;
  width: 16px;
  height: 0;
  vertical-align: middle;
  margin-right: 0.15rem;
}
.k-route { border-top: 2.4px solid var(--accent); }
.k-flight { border-top: 2px dotted var(--accent-soft); }
</style>
