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
    <div class="acto-head">
      <div class="acto-num">
        {{ acto.numeral }}
      </div>
      <div class="acto-head-text">
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
