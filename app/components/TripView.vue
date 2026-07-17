<script setup lang="ts">
// TripView — poseedor de la página. Llama a useTrip(slug) y renderiza la Parte II: topbar +
// hero + los dos archetipos (ActoCard / FichaCard) agrupados por parte (Vietnam / Camboya).
// "Añadir un viaje = añadir ficheros": las páginas son one-liners <TripView :slug>.
//
// De momento SOLO monta la Parte II (contexto cultural) — es lo estable del documento y lo que
// se enseña primero. La Parte I (itinerario, fichas de inversión) llegará cuando cierren las
// reservas; su esquema saldrá de la referencia, no del mockup.
const props = defineProps<{ slug: string }>()

const { trip, actos, fichas } = await useTrip(props.slug)

const vietnamActos = computed(() => actos.value.filter(a => a.part === 'vietnam'))
const vietnamFichas = computed(() => fichas.value.filter(f => f.part === 'vietnam'))
const camboyaActos = computed(() => actos.value.filter(a => a.part === 'camboya'))
const camboyaFichas = computed(() => fichas.value.filter(f => f.part === 'camboya'))
const hayCamboya = computed(() => camboyaActos.value.length + camboyaFichas.value.length > 0)
</script>

<template>
  <header class="topbar">
    <div class="brand">
      Vietnam <span class="brand-dot">✦</span> Camboya
    </div>
    <ThemeToggle />
  </header>

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
  </main>
</template>
