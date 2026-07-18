<script setup lang="ts">
// TripView — poseedor de la página. Llama a useTrip(slug) y renderiza en dos tiempos:
//  · El plan (lo práctico, primero): hero del viaje → día a día (DiaCard) → dinero (InversionCard)
//    → reservas y dónde dormir (RecoCard). Es lo que se usa durante el viaje.
//  · El relato (el contexto cultural, después): actos/fichas de Vietnam y Camboya, cada país tras
//    su umbral. Es el porqué: se lee antes de cada tramo.
// "Añadir un viaje = añadir ficheros": las páginas son one-liners <TripView :slug>.
const props = defineProps<{ slug: string }>()

const { trip, actos, fichas, inversiones, dias, recos } = await useTrip(props.slug)

const vietnamActos = computed(() => actos.value.filter(a => a.part === 'vietnam'))
const vietnamFichas = computed(() => fichas.value.filter(f => f.part === 'vietnam'))
const camboyaActos = computed(() => actos.value.filter(a => a.part === 'camboya'))
const camboyaFichas = computed(() => fichas.value.filter(f => f.part === 'camboya'))
const hayCamboya = computed(() => camboyaActos.value.length + camboyaFichas.value.length > 0)
const hayPlan = computed(() => dias.value.length + inversiones.value.length > 0)

// Recomendaciones (Parte I · prácticos): agrupadas por tipo, en orden fijo de grupo.
const RECO_KINDS = [
  { kind: 'dormir', label: 'Dónde dormir' },
  { kind: 'reservar', label: 'Reservas por hacer' },
  { kind: 'comer', label: 'Dónde comer' },
  { kind: 'moverse', label: 'Cómo moverse' },
] as const
const recoGroups = computed(() => RECO_KINDS
  .map(k => ({ ...k, items: recos.value.filter(r => r.kind === k.kind) }))
  .filter(g => g.items.length))

// Todas las anclas que existen en la página (slugs de todo el contenido + umbrales fijos). Un chip
// "dónde lo veréis" de una ficha se vuelve enlace clicable SOLO si su destino ya existe; si aún no
// (p. ej. una ficha de monumento por escribir), queda como etiqueta. Se auto-activan al crecer la guía.
const knownAnchors = computed(() => new Set<string>([
  ...actos.value.map(a => a.slug),
  ...fichas.value.map(f => f.slug),
  ...inversiones.value.map(i => i.slug),
  ...dias.value.map(d => d.slug),
  ...recos.value.map(r => r.slug),
  'el-plan', 'gasto', 'reservas', 'vietnam', 'camboya',
]))

// Índice flotante ─────────────────────────────────────────────────────────────
// Etiqueta corta del índice: navLabel si existe, si no el título sin marcas de markdown.
const stripMd = (s: string) => s
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [txt](url) → txt
  .replace(/[*`]/g, '')
  .trim()

const nav = computed(() => {
  const groups: { key: string, label: string, anchor: string, items: { id: string, label: string, numeral?: string, kind: 'acto' | 'ficha' | 'inversion' | 'dia' | 'reco' }[] }[] = []
  // El plan primero (lo práctico): el día a día, el gasto y las reservas —cada bloque, un grupo.
  if (dias.value.length) {
    groups.push({
      key: 'plan',
      label: 'El viaje, día a día',
      anchor: 'el-plan',
      items: dias.value.map(d => ({ id: d.slug, label: d.navLabel ?? stripMd(d.title), kind: 'dia' as const })),
    })
  }
  if (inversiones.value.length) {
    groups.push({
      key: 'gasto',
      label: 'Dónde gastar',
      anchor: 'gasto',
      items: inversiones.value.map(i => ({ id: i.slug, label: i.navLabel ?? stripMd(i.title), kind: 'inversion' as const })),
    })
  }
  if (recos.value.length) {
    // Comer y moverse se colapsan a UN enlace por categoría (apunta a su subsección, #comer/#moverse)
    // para acortar el índice; dormir y reservar se listan uno a uno (los hoteles y las reservas se
    // consultan por separado).
    const items = recoGroups.value.flatMap(g =>
      (g.kind === 'comer' || g.kind === 'moverse')
        ? [{ id: g.kind, label: g.label, kind: 'reco' as const }]
        : g.items.map(r => ({ id: r.slug, label: r.navLabel ?? r.title, kind: 'reco' as const })),
    )
    groups.push({ key: 'reservas', label: 'Reservas · dónde dormir', anchor: 'reservas', items })
  }
  // Después, el relato cultural: Vietnam y Camboya.
  groups.push({
    key: 'vietnam',
    label: 'Vietnam',
    anchor: 'vietnam',
    items: [
      ...vietnamActos.value.map(a => ({ id: a.slug, label: a.navLabel ?? stripMd(a.title), numeral: a.numeral, kind: 'acto' as const })),
      ...vietnamFichas.value.map(f => ({ id: f.slug, label: f.navLabel ?? f.title, kind: 'ficha' as const })),
    ],
  })
  if (hayCamboya.value) {
    groups.push({
      key: 'camboya',
      label: 'Camboya',
      anchor: 'camboya',
      items: [
        ...camboyaActos.value.map(a => ({ id: a.slug, label: a.navLabel ?? stripMd(a.title), numeral: a.numeral, kind: 'acto' as const })),
        ...camboyaFichas.value.map(f => ({ id: f.slug, label: f.navLabel ?? f.title, kind: 'ficha' as const })),
      ],
    })
  }
  return groups
})

const indexOpen = ref(false)
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <button
        class="gi-btn"
        type="button"
        :aria-expanded="indexOpen"
        aria-controls="guide-index"
        @click="indexOpen = !indexOpen"
      >
        <span
          class="gi-btn-icon"
          aria-hidden="true"
        >☰</span> Índice
      </button>
      <div class="brand">
        Vietnam <span class="brand-dot">✦</span> Camboya
      </div>
    </div>
    <ThemeToggle />
  </header>

  <GuideIndex
    id="guide-index"
    :groups="nav"
    :open="indexOpen"
    @close="indexOpen = false"
  />

  <main class="wrap">
    <section
      v-if="trip"
      class="hero"
    >
      <div class="eyebrow">
        {{ trip.eyebrow }}
      </div>
      <h1>
        <MDC
          :value="trip.title"
          unwrap="p"
        />
      </h1>
      <p
        v-if="trip.lede"
        class="lede"
      >
        <MDC
          :value="trip.lede"
          unwrap="p"
        />
      </p>
    </section>

    <!-- El plan primero (lo práctico): el día a día → el dinero. -->
    <template v-if="hayPlan">
      <Threshold
        id="el-plan"
        overline="De Hanoi a Angkor · dieciséis días"
        title="El viaje, *día a día*"
        dek="El eje no es la agenda por horas sino los bloques del día —amanecer, mañana, siesta, tarde, noche— y su «ventana óptima»: por qué *entonces* (la luz, el gentío, el calor), no a qué hora."
      />
      <DiaCard
        v-for="d in dias"
        :key="d.slug"
        :dia="d"
      />

      <template v-if="inversiones.length">
        <Threshold
          id="gasto"
          overline="El dinero del viaje"
          title="Dónde gastar, dónde *no*"
          dek="Aquí no se gasta por gastar. Cada decisión que cuesta dinero llega con su ficha —cuesta, qué compra, la alternativa— y su veredicto. Que algunas salgan «prescindible» es lo que hace que las demás valgan."
        />
        <InversionCard
          v-for="inv in inversiones"
          :key="inv.slug"
          :inversion="inv"
        />
      </template>
    </template>

    <!-- Los prácticos: el directorio de hoteles y reservas (agrupado por tipo). -->
    <template v-if="recos.length">
      <Threshold
        id="reservas"
        overline="Los prácticos"
        title="Reservas y *dónde dormir*"
        dek="El tablero de lo que hay que reservar —con su estado— y dónde dormir en cada tramo. Lo pendiente en oro; lo cerrado, en índigo."
      />
      <div
        v-for="g in recoGroups"
        :id="g.kind"
        :key="g.kind"
        class="reco-group"
      >
        <div class="reco-group-label">
          {{ g.label }}
        </div>
        <RecoCard
          v-for="r in g.items"
          :key="r.slug"
          :reco="r"
        />
      </div>
    </template>

    <!-- Después, el relato cultural: primero Vietnam, luego Camboya. Cada país tras su umbral. -->
    <Threshold
      id="vietnam"
      overline="Y ahora, el porqué"
      title="Vietnam · *por dentro*"
      dek="Esto no es un listado de sitios: es el trasfondo que convierte una carretera de montaña en mil años de resistencia, y tres días de piedras en tres de significado. Se lee *antes* de cada tramo, y conviven dos tipos de ficha: las que se leen del tirón, como un capítulo, y las que se consultan de un vistazo antes de una visita."
    />
    <ActoCard
      v-for="a in vietnamActos"
      :key="a.slug"
      :acto="a"
    />
    <FichaCard
      v-for="f in vietnamFichas"
      :key="f.slug"
      :ficha="f"
      :known-anchors="knownAnchors"
    />

    <!-- Camboya -->
    <template v-if="hayCamboya">
      <Threshold
        id="camboya"
        overline="El segundo mundo del viaje"
        title="Camboya · *Angkor*"
        dek="De los mil años de resistencia de Vietnam a los seiscientos de un imperio que talló una montaña entera para ser el centro del universo."
      />
      <ActoCard
        v-for="a in camboyaActos"
        :key="a.slug"
        :acto="a"
      />
      <FichaCard
        v-for="f in camboyaFichas"
        :key="f.slug"
        :ficha="f"
        :known-anchors="knownAnchors"
      />
    </template>
  </main>
</template>
