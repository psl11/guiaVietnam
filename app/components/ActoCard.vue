<script setup lang="ts">
// ActoCard — archetipo narrativo (cinabrio). Se lee del tirón: numeral árabe grande, capitular
// en el lead, citas destacadas (blockquotes del markdown → pull-quotes vía CSS) y caja "lo veréis".
// La prosa va en Markdown y se renderiza con <MDC> (auto-importado de @nuxt/content); `unwrap="p"`
// en título y lead para que el contenido inline caiga directo en su contenedor (h2 / p.acto-lead).
import type { Acto } from '~~/shared/schemas'

defineProps<{ acto: Acto }>()
</script>

<template>
  <article
    :id="acto.slug"
    class="acto"
  >
    <!-- Cabecera en grid (2 col × 2 filas): en desktop el numeral abarca las dos filas a la
         izquierda; en móvil (ver base.css) numeral+kicker arriba y el título a todo el ancho
         debajo, para que no quede arrinconado en una columna estrecha. -->
    <div class="acto-head">
      <!-- El numeral va en SVG para que ESCALE con la altura del bloque (kicker + título): con
           height:100% rellena la celda del grid, así que con 1, 2 o 3 líneas de título siempre
           abarca de la línea del kicker a la base del título. Sin JS, sin parpadeo. -->
      <svg
        class="acto-num"
        viewBox="0 0 60 76"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <text
          x="30"
          y="70"
          text-anchor="middle"
        >{{ acto.numeral }}</text>
      </svg>
      <div class="acto-kicker">
        {{ acto.kicker }}
      </div>
      <h2>
        <MDC
          :value="acto.title"
          unwrap="p"
        />
      </h2>
    </div>
    <div class="acto-rule" />

    <p class="acto-lead">
      <MDC
        :value="acto.lead"
        unwrap="p"
      />
    </p>
    <div class="acto-body">
      <MDC :value="acto.body" />
    </div>

    <div
      v-if="acto.connect"
      class="connect"
    >
      <div class="connect-label">
        {{ acto.connect.label }}
      </div>
      <MDC :value="acto.connect.body" />
    </div>
  </article>
</template>
