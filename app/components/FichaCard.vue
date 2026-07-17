<script setup lang="ts">
// FichaCard — archetipo de consulta (índigo, modelo B: cabecera índigo + cuerpo en papel).
// Se mira antes de una visita: emblema + epíteto + secciones con título + chips "dónde lo veréis".
// Los emblemas son SVG de CONFIANZA (constantes de este módulo, nunca datos de usuario) → v-html
// seguro. La prosa de las secciones va en Markdown y se renderiza con <MDC>.
import type { Ficha } from '~~/shared/schemas'

defineProps<{ ficha: Ficha }>()

// Emblemas: trazo simple, currentColor (heredan el oro de .ficha-emblem). Añadir aquí uno nuevo
// = una clave más; el campo `emblem` de la ficha lo referencia.
const EMBLEMS: Record<string, string> = {
  // Prasat / templo-montaña jemer
  templo: '<svg viewBox="0 0 40 44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M20 3 L26 15 L23 15 L28 27 L24 27 L30 40 L10 40 L16 27 L12 27 L17 15 L14 15 Z"/><line x1="4" y1="40" x2="36" y2="40"/><circle cx="20" cy="9" r="1.4" fill="currentColor" stroke="none"/></svg>',
  // Loto (budismo / religión)
  loto: '<svg viewBox="0 0 44 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M22 6 C24 14 24 20 22 26 C20 20 20 14 22 6 Z"/><path d="M22 26 C16 22 12 16 11 9 C18 11 21 18 22 26 Z"/><path d="M22 26 C28 22 32 16 33 9 C26 11 23 18 22 26 Z"/><path d="M8 20 C10 26 15 30 22 31 C29 30 34 26 36 20 C33 30 28 34 22 34 C16 34 11 30 8 20 Z"/></svg>',
  // Incienso / altar de los ancestros
  incienso: '<svg viewBox="0 0 40 44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 8 C13 12 15 13 14 17 M20 6 C19 11 21 12 20 17 M26 8 C25 12 27 13 26 17"/><rect x="9" y="24" width="22" height="12" rx="2"/><line x1="14" y1="24" x2="14" y2="17"/><line x1="20" y1="24" x2="20" y2="16"/><line x1="26" y1="24" x2="26" y2="17"/><line x1="13" y1="30" x2="27" y2="30"/></svg>',
  // Montaña kárstica (Ninh Binh / Ha Giang)
  montana: '<svg viewBox="0 0 44 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M4 34 L14 14 L20 24 L27 8 L40 34 Z"/><line x1="2" y1="34" x2="42" y2="34"/></svg>',
}
</script>

<template>
  <section
    :id="ficha.slug"
    class="ficha"
  >
    <div class="ficha-band">
      <div class="ficha-head">
        <!-- SVG de confianza (constante del módulo), nunca dato de usuario. -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          class="ficha-emblem"
          aria-hidden="true"
          v-html="EMBLEMS[ficha.emblem] || EMBLEMS.loto"
        />
        <div>
          <div class="ficha-kicker">
            {{ ficha.kicker }}
          </div>
          <h2>{{ ficha.title }}</h2>
        </div>
      </div>
      <div
        v-if="ficha.epithet"
        class="ficha-epithet"
      >
        <MDC
          :value="ficha.epithet"
          unwrap="p"
        />
      </div>
    </div>

    <div class="ficha-body">
      <div
        v-for="(s, i) in ficha.sections"
        :key="i"
        class="ficha-section"
      >
        <h3 v-if="s.heading">
          {{ s.heading }}
        </h3>
        <div class="ficha-section-body">
          <MDC :value="s.body" />
        </div>
      </div>

      <div
        v-if="ficha.seenIn?.length"
        class="seen-in"
      >
        <div class="seen-in-label">
          Dónde lo veréis
        </div>
        <div class="chips">
          <a
            v-for="l in ficha.seenIn"
            :key="l.ref"
            class="chip"
            :href="l.ref"
          >{{ l.label }}</a>
        </div>
      </div>
    </div>
  </section>
</template>
