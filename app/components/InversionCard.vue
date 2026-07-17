<script setup lang="ts">
// InversionCard — la ficha de decisión de dinero (Parte I). Veredicto con badge de color
// (imprescindible=oro · merece=índigo · solo-si=oro suave · prescindible=cinabrio) + el desglose
// cuesta/qué compra/la alternativa. La regla de oro: algunas SALEN "prescindible", y por eso vale.
// La prosa se targetea sobre `.inversion` (ancestro estable), robusto ante el class-loss de MDC.
import type { Inversion } from '~~/shared/schemas'

defineProps<{ inversion: Inversion }>()
</script>

<template>
  <section
    :id="inversion.slug"
    class="inversion"
    :data-verdict="inversion.verdict"
  >
    <div class="inversion-head">
      <div class="inversion-heading">
        <div class="inversion-kicker">
          {{ inversion.kicker }}
        </div>
        <h3>
          <MDC :value="inversion.title" />
        </h3>
      </div>
      <span class="inversion-badge">{{ inversion.verdictLabel }}</span>
    </div>

    <div class="inversion-lede">
      <MDC :value="inversion.lede" />
    </div>

    <dl class="inversion-ledger">
      <div
        v-for="(row, i) in inversion.ledger"
        :key="i"
        class="inversion-row"
      >
        <dt>{{ row.label }}</dt>
        <dd>
          <MDC :value="row.body" />
        </dd>
      </div>
    </dl>

    <div
      v-if="inversion.curiosidades?.length"
      class="curiosidades"
    >
      <div class="curiosidades-label">
        Curiosidades
      </div>
      <ul>
        <li
          v-for="(c, i) in inversion.curiosidades"
          :key="i"
        >
          <MDC :value="c" />
        </li>
      </ul>
    </div>
  </section>
</template>
