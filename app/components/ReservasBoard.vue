<script setup lang="ts">
// ReservasBoard — el tablero de «qué hay que reservar y cuándo», para mirar en el móvil.
//
// SE DERIVA DE LOS DATOS, no se escribe a mano: recorre las reservas pendientes (`reco`), los
// locales con reserva (`comida`, `salir`) y los reparte en cuatro bandas por urgencia. Esa fue la
// condición para montarlo — un tablero copiado a mano se queda viejo a la primera edición, y este
// no puede: si una ficha pasa a `reservado`, desaparece sola de aquí.
//
// La única señal que no se puede deducir es la banda, así que va en el campo `urgencia` del schema.
// Cuando falta, se aplica la regla por defecto de REGLA() de abajo.
import type { Reco, Comida, Salir } from '~~/shared/schemas'

const props = defineProps<{ recos: Reco[], comidas: Comida[], salir: Salir[] }>()

type Banda = 'ya' | 'semanas' | 'dias' | 'vispera'
interface Item { slug: string, titulo: string, donde: string, nota: string, banda: Banda, pendiente: boolean }

const pideReserva = (r?: string) => !!r && !/^no$/i.test(r.trim())

// Regla por defecto cuando la ficha no declara `urgencia`.
const REGLA = (fuente: 'reco' | 'comida', reserva?: string): Banda => {
  if (fuente === 'reco') return 'ya' // una reserva pendiente del plan bloquea el viaje
  if (/semanas/i.test(reserva ?? '')) return 'semanas'
  if (/imprescindible/i.test(reserva ?? '')) return 'dias'
  return 'vispera'
}

const items = computed<Item[]>(() => {
  const out: Item[] = []
  for (const r of props.recos) {
    if (r.status !== 'pendiente') continue
    out.push({
      slug: r.slug,
      titulo: r.navLabel ?? r.title,
      donde: r.area ?? '',
      nota: r.note ?? '',
      banda: (r.urgencia as Banda) ?? REGLA('reco'),
      pendiente: true,
    })
  }
  const conFichaPropia = props.recos.map(r => r.slug)
  for (const c of [...props.comidas, ...props.salir]) {
    if (!pideReserva(c.reserva)) continue
    // Si ese local ya tiene su propia ficha de reserva (p. ej. Cuisine Wat Damnak), manda esa.
    if (conFichaPropia.some(s => s.startsWith(c.slug))) continue
    out.push({
      slug: c.slug,
      titulo: c.title,
      donde: c.city,
      nota: c.reserva ?? '',
      banda: (c.urgencia as Banda) ?? REGLA('comida', c.reserva),
      pendiente: false,
    })
  }
  return out
})

const BANDAS: { key: Banda, label: string, dek: string }[] = [
  { key: 'ya', label: 'Ahora mismo', dek: 'Bloquean el viaje: sin esto no hay itinerario.' },
  { key: 'semanas', label: 'Con semanas', dek: 'Se agotan. Cuanto antes, mejor precio o mejor mesa.' },
  { key: 'dias', label: 'Unos días antes', dek: 'Basta con avisar, pero hay que acordarse.' },
  { key: 'vispera', label: 'La víspera', dek: 'Se resuelven sobre la marcha — y son las que se olvidan.' },
]

const grupos = computed(() => BANDAS
  .map(b => ({
    ...b,
    // En la última banda solo entra lo del plan: los «recomendable» de restaurante son dos docenas
    // y taparían lo urgente, así que se cuentan al pie y se mandan a Gastronomía.
    items: items.value.filter(i => i.banda === b.key && (b.key !== 'vispera' || i.pendiente)),
  }))
  .filter(g => g.items.length))

// Los «recomendable» de restaurante no van al tablero uno a uno: serían dos docenas de líneas y
// taparían lo urgente. Se cuentan y se manda a Gastronomía, que es donde están con su ficha.
const sueltos = computed(() => items.value.filter(i => i.banda === 'vispera' && !i.pendiente).length)
</script>

<template>
  <div class="resv">
    <ol class="resv-bandas">
      <li
        v-for="g in grupos"
        :key="g.key"
        class="banda"
        :data-banda="g.key"
      >
        <div class="banda-cab">
          <span class="banda-label">{{ g.label }}</span>
          <span class="banda-n">{{ g.items.length }}</span>
        </div>
        <p class="banda-dek">
          {{ g.dek }}
        </p>
        <ul class="banda-items">
          <li
            v-for="i in g.items"
            :key="i.slug"
            class="resv-item"
          >
            <a
              :href="`#${i.slug}`"
              class="resv-titulo"
            >{{ i.titulo }}</a>
            <span
              v-if="i.donde"
              class="resv-donde"
            >{{ i.donde }}</span>
            <span
              v-if="i.nota"
              class="resv-nota"
            >{{ i.nota }}</span>
          </li>
        </ul>
      </li>
    </ol>
    <p
      v-if="sueltos"
      class="resv-pie"
    >
      Y hay <strong>{{ sueltos }}</strong> restaurantes y bares más con reserva recomendable pero no
      obligatoria. No se listan aquí para no tapar lo urgente: están en
      <a href="#gastronomia">Gastronomía</a>, cada uno con su ficha.
    </p>
  </div>
</template>

<style scoped>
.resv { margin: 0 0 1.4rem; }
.resv-bandas { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1.5rem; }

.banda-cab { display: flex; align-items: baseline; gap: .55rem; padding-bottom: .3rem; border-bottom: 2px solid var(--accent); }
.banda-label {
  font-family: 'JetBrains Mono', monospace; font-size: .72rem; font-weight: 600;
  letter-spacing: .12em; text-transform: uppercase; color: var(--accent);
}
.banda-n {
  font-family: 'JetBrains Mono', monospace; font-size: .62rem; font-weight: 600;
  color: var(--bg-elev); background: var(--accent);
  min-width: 1.15rem; text-align: center; border-radius: 99px; padding: .08rem .3rem;
}
.banda[data-banda='semanas'] .banda-cab { border-bottom-color: var(--gold); }
.banda[data-banda='semanas'] .banda-label { color: var(--gold); }
.banda[data-banda='semanas'] .banda-n { background: var(--gold); }
.banda[data-banda='dias'] .banda-cab,
.banda[data-banda='vispera'] .banda-cab { border-bottom-color: var(--line); }
.banda[data-banda='dias'] .banda-label,
.banda[data-banda='vispera'] .banda-label { color: var(--ink-soft); }
.banda[data-banda='dias'] .banda-n,
.banda[data-banda='vispera'] .banda-n { background: var(--ink-faint); }

.banda-dek { font-size: .84rem; color: var(--ink-soft); margin: .45rem 0 .2rem; max-width: 44ch; }
.banda-items { list-style: none; margin: 0; padding: 0; }
.resv-item {
  display: grid; align-items: baseline; gap: .1rem .8rem;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.6fr);
  padding: .5rem .1rem; border-bottom: 1px solid var(--line-soft);
}
.resv-item:last-child { border-bottom: none; }
.resv-titulo {
  font-weight: 600; font-size: .95rem; color: var(--ink); text-decoration: none;
  border-bottom: 1px solid var(--line);
}
.resv-titulo:hover { color: var(--accent); border-bottom-color: var(--accent); }
.resv-donde {
  grid-row: 2; grid-column: 1;
  font-family: 'JetBrains Mono', monospace; font-size: .63rem;
  letter-spacing: .04em; text-transform: uppercase; color: var(--ink-faint);
}
.resv-nota { grid-row: 1 / span 2; grid-column: 2; font-size: .82rem; color: var(--ink-soft); align-self: center; }
.resv-pie { margin-top: 1.6rem; font-size: .86rem; color: var(--ink-soft); max-width: 46ch; }

@media (max-width: 620px) {
  .resv-item { grid-template-columns: 1fr; gap: .08rem; }
  .resv-donde { grid-row: auto; grid-column: auto; }
  .resv-nota { grid-row: auto; grid-column: auto; align-self: start; }
}
</style>
