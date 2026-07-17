<script setup lang="ts">
// TripView — poseedor de la página. Llama a useTrip(slug) y renderiza la Parte II: topbar +
// hero + los dos archetipos (ActoCard / FichaCard) agrupados por parte (Vietnam / Camboya).
// "Añadir un viaje = añadir ficheros": las páginas son one-liners <TripView :slug>.
//
// De momento SOLO monta la Parte II (contexto cultural) — es lo estable del documento y lo que
// se enseña primero. La Parte I (itinerario, fichas de inversión) llegará cuando cierren las
// reservas; su esquema saldrá de la referencia, no del mockup.
const props = defineProps<{ slug: string }>()

const { trip, actos, fichas, inversiones } = await useTrip(props.slug)

const vietnamActos = computed(() => actos.value.filter(a => a.part === 'vietnam'))
const vietnamFichas = computed(() => fichas.value.filter(f => f.part === 'vietnam'))
const camboyaActos = computed(() => actos.value.filter(a => a.part === 'camboya'))
const camboyaFichas = computed(() => fichas.value.filter(f => f.part === 'camboya'))
const hayCamboya = computed(() => camboyaActos.value.length + camboyaFichas.value.length > 0)

// Índice flotante ─────────────────────────────────────────────────────────────
// Etiqueta corta del índice: navLabel si existe, si no el título sin marcas de markdown.
const stripMd = (s: string) => s
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [txt](url) → txt
  .replace(/[*`]/g, '')
  .trim()

const nav = computed(() => {
  const groups: { key: string, label: string, anchor: string, items: { id: string, label: string, numeral?: string, kind: 'acto' | 'ficha' | 'inversion' }[] }[] = []
  groups.push({
    key: 'vietnam',
    label: 'Vietnam',
    anchor: 'top',
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
  if (inversiones.value.length) {
    groups.push({
      key: 'plan',
      label: 'Parte I · El plan',
      anchor: 'el-plan',
      items: inversiones.value.map(i => ({ id: i.slug, label: i.navLabel ?? stripMd(i.title), kind: 'inversion' as const })),
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

    <!-- Vietnam -->
    <ActoCard
      v-for="a in vietnamActos"
      :key="a.slug"
      :acto="a"
    />
    <FichaCard
      v-for="f in vietnamFichas"
      :key="f.slug"
      :ficha="f"
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
      />
    </template>

    <!-- Parte I · el plan (usa el Threshold en su segundo cometido: separar plan y contexto) -->
    <template v-if="inversiones.length">
      <Threshold
        id="el-plan"
        overline="Y ahora, el plan"
        title="Dónde gastar, dónde *no*"
        dek="Aquí no se gasta por gastar. Cada decisión que cuesta dinero llega con su ficha —cuesta, qué compra, la alternativa— y su veredicto. Que algunas salgan «prescindible» es lo que hace que las demás valgan."
      />
      <InversionCard
        v-for="inv in inversiones"
        :key="inv.slug"
        :inversion="inv"
      />
    </template>
  </main>
</template>
