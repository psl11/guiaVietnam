<script setup lang="ts">
// ComidaCard — una entrada del directorio gastronómico (restaurante/café/puesto/bar). Se mira de un
// vistazo: sello (Michelin/50 Best…) + tipo · zona · encaje logístico + chips (precio · reserva ·
// colas · VEG coloreado por estatus) + «qué pedir» destacado + el porqué en <MDC>. El chip VEG es
// obligatorio (la novia es vegetariana); su color sale del propio texto. Sin <MDC unwrap> → hidrata
// limpio. Los cruces (`seenIn`) van como enlaces internos (los resuelve el plugin anchor-nav).
import type { Comida } from '~~/shared/schemas'

const props = defineProps<{ comida: Comida }>()

// Estatus veg para el color del chip: verde = apto/100%, rojo = no apto, ámbar = opciones/limitado.
const vegClass = computed(() => {
  const v = props.comida.veg.toLowerCase()
  if (/no apto|no veg|solo (él|para él|para ti|para ella)/.test(v)) return 'veg--no'
  if (/(100\s*%|vegano|vegana|100% veg|excelente)/.test(v) && !/limitad/.test(v)) return 'veg--si'
  return 'veg--ok'
})
</script>

<template>
  <article
    :id="comida.slug"
    class="comida"
  >
    <div class="comida-head">
      <div class="comida-headings">
        <h3 class="comida-title">
          {{ comida.title }}
        </h3>
        <div class="comida-sub">
          <span class="comida-tipo">{{ comida.tipo }}</span>
          <template v-if="comida.area">
            <span class="comida-dot">·</span>{{ comida.area }}
          </template>
        </div>
      </div>
      <span
        v-if="comida.badge"
        class="comida-badge"
      >{{ comida.badge }}</span>
    </div>

    <div
      v-if="comida.cuando"
      class="comida-cuando"
    >
      <span aria-hidden="true">📍</span> {{ comida.cuando }}
    </div>

    <div class="comida-chips">
      <span
        v-if="comida.precio"
        class="cchip"
      >{{ comida.precio }}</span>
      <span
        v-if="comida.reserva"
        class="cchip"
      >Reserva: {{ comida.reserva }}</span>
      <span
        v-if="comida.colas"
        class="cchip"
      >Colas: {{ comida.colas }}</span>
      <span
        class="cchip"
        :class="vegClass"
      >VEG · {{ comida.veg }}</span>
    </div>

    <div
      v-if="comida.quePedir"
      class="comida-pedir"
    >
      <span class="comida-pedir-label">Qué pedir</span>
      <MDC :value="comida.quePedir" />
    </div>

    <div class="comida-body">
      <MDC :value="comida.body" />
    </div>

    <div
      v-if="comida.link || comida.seenIn?.length"
      class="comida-foot"
    >
      <a
        v-if="comida.link"
        class="comida-link"
        :href="comida.link.url"
        target="_blank"
        rel="noopener noreferrer"
      >{{ comida.link.label }} →</a>
      <a
        v-for="l in comida.seenIn"
        :key="l.ref"
        class="chip"
        :href="l.ref"
      >{{ l.label }}</a>
    </div>
  </article>
</template>
