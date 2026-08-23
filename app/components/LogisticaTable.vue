<script setup lang="ts">
// LogisticaTable — el esquema de movimientos del viaje, en dos tablas y de un vistazo.
//
// Existe porque con cinco vuelos, dos buses cama y ocho traslados la logística ya no cabe en la
// cabeza, y hoy está repartida por dieciséis días. Aquí se lee de corrido:
//   · «Dónde dormís cada noche» — se DERIVA de los días (eyebrow + navLabel + dormir), sin datos
//     nuevos: es la misma verdad, vista como columna.
//   · «Todos los trayectos» — la colección `tramo`: solo el dato duro (hora, trayecto, medio,
//     estado) y un puntero a la ficha práctica que lo explica.
// No es una tabla HTML sino una rejilla, para que en el móvil reflowe en vez de hacer scroll
// lateral — que es donde de verdad se va a consultar esto.
import type { Dia, Tramo } from '~~/shared/schemas'

const props = defineProps<{ dias: Dia[], tramos: Tramo[] }>()

// «El plan · Día 10 · dom 20 sep» → { numero: 'Día 10', fecha: 'dom 20 sep' }
// «Día 10 · Hoi An» → 'Hoi An'
const noches = computed(() => props.dias.map((d) => {
  const partes = d.eyebrow.split('·').map(s => s.trim())
  const nav = (d.navLabel ?? '').split('·').map(s => s.trim())
  return {
    slug: d.slug,
    numero: partes[1] ?? '',
    fecha: partes[2] ?? '',
    donde: nav[1] ?? nav[0] ?? '',
    cama: d.dormir?.lugar ?? '—',
  }
}))

// Los tramos, agrupados por día para que la tabla tenga cabeceras y no sea una lista plana de 20.
const porDia = computed(() => {
  const grupos: { clave: number, fecha: string, items: Tramo[] }[] = []
  for (const t of props.tramos) {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.clave === t.dia) ultimo.items.push(t)
    else grupos.push({ clave: t.dia, fecha: t.fecha, items: [t] })
  }
  return grupos
})

const etiquetaDia = (g: { clave: number, items: Tramo[] }) => {
  const hasta = g.items[0]?.diaHasta
  return hasta ? `Días ${g.clave}-${hasta}` : `Día ${g.clave}`
}

const ESTADO: Record<string, string> = { reservado: 'Cerrado', pendiente: 'Por reservar', opcional: 'Opcional' }
</script>

<template>
  <div class="logi">
    <!-- ── Dónde dormís cada noche ─────────────────────────────────── -->
    <h3 class="logi-h">
      Dónde estáis cada día
    </h3>
    <p class="logi-dek">
      Las dieciséis noches de un vistazo. Dos de ellas son un autobús cama y una es un avión — están
      contadas como cama porque lo son.
    </p>
    <ol class="logi-noches">
      <li
        v-for="n in noches"
        :key="n.slug"
        class="noche"
      >
        <a
          :href="`#${n.slug}`"
          class="noche-dia"
        >{{ n.numero }}</a>
        <span class="noche-fecha">{{ n.fecha }}</span>
        <span class="noche-donde">{{ n.donde }}</span>
        <span class="noche-cama">{{ n.cama }}</span>
      </li>
    </ol>

    <!-- ── Todos los trayectos ─────────────────────────────────────── -->
    <h3 class="logi-h logi-h2">
      Todos los trayectos
    </h3>
    <p class="logi-dek">
      Cada movimiento del viaje con su hora y su estado. Lo que está <em>por reservar</em> va en oro.
    </p>
    <div
      v-for="g in porDia"
      :key="g.clave"
      class="logi-grupo"
    >
      <div class="logi-grupo-cab">
        <span class="logi-grupo-dia">{{ etiquetaDia(g) }}</span>
        <span class="logi-grupo-fecha">{{ g.fecha }}</span>
      </div>
      <div
        v-for="t in g.items"
        :key="t.slug"
        class="tramo"
        :data-tipo="t.tipo"
        :data-status="t.status"
      >
        <span
          class="tramo-icono"
          :aria-label="t.tipo"
          role="img"
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path
              v-if="t.tipo === 'vuelo'"
              d="M1.6 8.6 14.4 3.4 10.4 8.6 14.4 12.9Z"
              class="ico-fill"
            />
            <g
              v-else-if="t.tipo === 'bus'"
              class="ico-stroke"
            >
              <rect
                x="2.2"
                y="3"
                width="11.6"
                height="8"
                rx="1.6"
              />
              <path d="M2.2 8.4h11.6M4.6 11v1.8M11.4 11v1.8" />
            </g>
            <g
              v-else-if="t.tipo === 'coche'"
              class="ico-stroke"
            >
              <path d="M2 10.4 3.4 6.4h9.2l1.4 4v2H2Z" />
              <path d="M4.4 12.4v1.2M11.6 12.4v1.2" />
            </g>
            <g
              v-else-if="t.tipo === 'moto'"
              class="ico-stroke"
            >
              <circle
                cx="3.6"
                cy="11"
                r="2.4"
              />
              <circle
                cx="12.4"
                cy="11"
                r="2.4"
              />
              <path d="M3.6 11 7 5.6h3.4l2 5.4M6.4 5.6h3" />
            </g>
            <g
              v-else
              class="ico-stroke"
            >
              <path d="M2 5.6h10.4M10.2 3.4l2.2 2.2-2.2 2.2M14 10.4H3.6M5.8 8.2 3.6 10.4l2.2 2.2" />
            </g>
          </svg>
        </span>

        <span class="tramo-hora">
          <template v-if="t.salida">{{ t.salida }}</template>
          <template v-if="t.salida && t.llegada"><span class="tramo-flecha"> → </span></template>
          <template v-if="t.llegada">{{ t.llegada }}</template>
          <template v-if="!t.salida && !t.llegada">—</template>
        </span>

        <span class="tramo-ruta">
          <a
            v-if="t.ref"
            :href="t.ref"
          >{{ t.desde }} → {{ t.hasta }}</a>
          <template v-else>{{ t.desde }} → {{ t.hasta }}</template>
        </span>

        <span class="tramo-medio">
          {{ t.medio }}<template v-if="t.medio && t.duracion"> · </template>{{ t.duracion }}
        </span>

        <span
          v-if="t.status"
          class="tramo-estado"
        >{{ ESTADO[t.status] }}</span>

        <span
          v-if="t.nota"
          class="tramo-nota"
        >{{ t.nota }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logi { margin: 0 0 1.4rem; }
.logi-h {
  font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 1.65rem;
  line-height: 1.1; margin: 0 0 .3rem; color: var(--ink);
}
.logi-h2 { margin-top: 2.6rem; }
.logi-dek { font-size: .92rem; color: var(--ink-soft); margin: 0 0 1rem; max-width: 46ch; }
.logi-dek em { color: var(--gold); font-style: normal; }

/* ── dónde dormís ── */
.logi-noches { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--line); }
.noche {
  display: grid; align-items: baseline; gap: .1rem .8rem;
  grid-template-columns: 4.6rem 6rem 1fr 1.35fr;
  padding: .5rem .2rem; border-bottom: 1px solid var(--line-soft);
}
.noche-dia {
  font-family: 'JetBrains Mono', monospace; font-size: .68rem; font-weight: 600;
  color: var(--accent); text-decoration: none; letter-spacing: .02em;
}
.noche-dia:hover { text-decoration: underline; }
.noche-fecha {
  font-family: 'JetBrains Mono', monospace; font-size: .66rem;
  color: var(--ink-faint); text-transform: uppercase; letter-spacing: .04em;
}
.noche-donde { font-weight: 600; font-size: .93rem; color: var(--ink); }
.noche-cama { font-size: .82rem; color: var(--ink-soft); }

/* ── trayectos ── */
.logi-grupo { margin-top: 1.1rem; }
.logi-grupo-cab {
  display: flex; align-items: baseline; gap: .6rem;
  padding: 0 0 .3rem; border-bottom: 1px solid var(--line);
}
.logi-grupo-dia {
  font-family: 'JetBrains Mono', monospace; font-size: .68rem; font-weight: 600;
  letter-spacing: .1em; text-transform: uppercase; color: var(--accent);
}
.logi-grupo-fecha {
  font-family: 'JetBrains Mono', monospace; font-size: .64rem;
  letter-spacing: .06em; text-transform: uppercase; color: var(--ink-faint);
}
.tramo {
  display: grid; align-items: baseline;
  grid-template-columns: 1.4rem 8.2rem minmax(0, 1.15fr) minmax(0, 1fr) auto;
  grid-template-areas: 'ico hora ruta medio estado' '. . nota nota nota';
  gap: .15rem .7rem;
  padding: .55rem .2rem; border-bottom: 1px solid var(--line-soft);
}
.tramo-icono { grid-area: ico; align-self: center; line-height: 0; color: var(--ink-faint); }
.tramo[data-tipo='vuelo'] .tramo-icono { color: var(--accent); }
.tramo[data-tipo='bus'] .tramo-icono,
.tramo[data-tipo='moto'] .tramo-icono { color: var(--indigo); }
.tramo-icono svg { width: 15px; height: 15px; }
.ico-fill { fill: currentColor; }
.ico-stroke { fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }

.tramo-hora {
  grid-area: hora; font-family: 'JetBrains Mono', monospace; font-size: .76rem;
  font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; white-space: nowrap;
}
.tramo-flecha { color: var(--ink-faint); font-weight: 400; }
.tramo-ruta { grid-area: ruta; font-size: .9rem; color: var(--ink); font-weight: 600; }
.tramo-ruta a { color: inherit; text-decoration: none; border-bottom: 1px solid var(--line); }
.tramo-ruta a:hover { border-bottom-color: var(--accent); color: var(--accent); }
.tramo-medio {
  grid-area: medio; font-family: 'JetBrains Mono', monospace; font-size: .68rem;
  color: var(--ink-soft); letter-spacing: .01em;
}
.tramo-estado {
  grid-area: estado; justify-self: end; white-space: nowrap;
  font-family: 'JetBrains Mono', monospace; font-size: .58rem; font-weight: 500;
  letter-spacing: .06em; text-transform: uppercase;
  padding: .2rem .5rem; border-radius: 99px; border: 1px solid;
  background: color-mix(in srgb, var(--gold) 13%, transparent);
  border-color: color-mix(in srgb, var(--gold) 34%, transparent); color: var(--gold);
}
.tramo[data-status='reservado'] .tramo-estado {
  background: color-mix(in srgb, var(--indigo) 12%, transparent);
  border-color: color-mix(in srgb, var(--indigo) 34%, transparent); color: var(--indigo);
}
.tramo[data-status='opcional'] .tramo-estado {
  background: color-mix(in srgb, var(--ink-faint) 10%, transparent);
  border-color: var(--line); color: var(--ink-faint);
}
.tramo-nota { grid-area: nota; font-size: .8rem; color: var(--ink-soft); margin-top: .12rem; }

@media (max-width: 640px) {
  .noche { grid-template-columns: 4.4rem 1fr; }
  .noche-fecha { justify-self: start; }
  .noche-donde { grid-column: 2; }
  .noche-cama { grid-column: 2; }
  .tramo {
    grid-template-columns: 1.4rem 1fr auto;
    grid-template-areas: 'ico hora estado' '. ruta ruta' '. medio medio' '. nota nota';
    gap: .12rem .6rem;
  }
  .tramo-medio { margin-top: .05rem; }
}
</style>
