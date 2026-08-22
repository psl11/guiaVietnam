<script setup>
// Mapa de referencia del viaje. SVG estático y autocontenido (sin red, offline-safe):
// la geometría de los países se genera en build-time (scratchpad/build-map.mjs) y se
// importa como datos. Hereda la paleta de laca vía var(--…), así que cambia con el tema.
import { viewBox, vnPath, khPath, cities as C } from './tripMapGeo.js'

// Ruta por tierra en orden de días: Hanói → Ninh Bình → (bus directo) Hà Giang → el loop → Hanói.
// El loop va en sentido antihorario, como lo hace el tour: Hà Giang → Du Già → Mèo Vạc → Đồng Văn →
// Quản Bạ → Hà Giang. `yenMinh` hace de vértice de Du Già, que cae casi encima.
const routeKeys = ['hanoi', 'ninhBinh', 'haGiang', 'yenMinh', 'meoVac', 'dongVan', 'quanBa', 'haGiang', 'hanoi']
const routePoints = routeKeys.map((k) => `${C[k].x},${C[k].y}`).join(' ')

// Los cuatro saltos en avión: Hanói ⇄ Đà Nẵng (Hoi An), Hanói → Siem Reap, Siem Reap → Saigón
// y Saigón → Hanói para enlazar con el vuelo de vuelta.
const flights = [
  `M${C.hanoi.x},${C.hanoi.y} Q212,188 ${C.daNang.x},${C.daNang.y}`,
  `M${C.hanoi.x},${C.hanoi.y} Q46,244 ${C.siemReap.x},${C.siemReap.y}`,
  `M${C.siemReap.x},${C.siemReap.y} Q104,486 ${C.saigon.x},${C.saigon.y}`,
  `M${C.saigon.x},${C.saigon.y} Q258,318 ${C.hanoi.x},${C.hanoi.y}`,
]

// Paradas etiquetadas (el bucle queda como trazo con 3 anclas: Hà Giang, Đồng Văn, Mèo Vạc).
const stops = [
  { key: 'hanoi', label: 'Hanói', dx: 7, dy: 4, anchor: 'start' },
  { key: 'ninhBinh', label: 'Ninh Bình', dx: 7, dy: 4, anchor: 'start' },
  { key: 'haGiang', label: 'Hà Giang', dx: -7, dy: 3, anchor: 'end' },
  { key: 'dongVan', label: 'Đồng Văn', dx: 7, dy: -3, anchor: 'start' },
  { key: 'meoVac', label: 'Mèo Vạc', dx: 7, dy: 8, anchor: 'start' },
  { key: 'daNang', label: 'Hoi An', dx: 7, dy: 4, anchor: 'start' },
  { key: 'siemReap', label: 'Siem Reap · Angkor', dx: 0, dy: 14, anchor: 'middle' },
  { key: 'saigon', label: 'Saigón', dx: 7, dy: 4, anchor: 'start' },
]
</script>

<template>
  <figure class="tripmap" aria-labelledby="tripmap-cap">
    <svg :viewBox="viewBox" role="img"
         aria-label="Mapa del viaje: el norte de Vietnam recorrido por tierra, y cuatro saltos en avión que enlazan Hoi An, Angkor y Saigón.">
      <!-- países -->
      <path :d="vnPath" class="land" />
      <path :d="khPath" class="land" />
      <!-- rótulos de país, al fondo -->
      <text x="282" y="330" class="country" transform="rotate(90 282 330)">VIETNAM</text>
      <text x="70" y="512" class="country">CAMBOYA</text>
      <!-- vuelos -->
      <path v-for="(f, i) in flights" :key="i" :d="f" class="flight" />
      <!-- ruta por tierra -->
      <polyline :points="routePoints" class="route" />
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
      El viaje, de un vistazo: <strong>el norte entero recorrido por tierra</strong>, y cuatro vuelos
      que cosen Hoi An, Angkor y Saigón. Lo que queda fuera es el sur profundo.
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
