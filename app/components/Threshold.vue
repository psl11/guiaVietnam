<script setup lang="ts">
// Threshold — el "umbral" entre grandes secciones (Vietnam→Camboya ahora; Parte I→Parte II en el
// futuro). Tratamiento de revista: aire generoso, filete con estrella dorada, sobrelínea a
// versalitas, título display grande y una bajada (dek) evocadora en cursiva. Reutilizable por props.
defineProps<{
  overline: string
  title: string // Markdown-inline: la *cursiva* sale en cinabrio
  dek?: string
}>()
</script>

<template>
  <section class="threshold">
    <div
      class="threshold-ornament"
      aria-hidden="true"
    >
      <span class="threshold-line" />
      <span class="threshold-mark">✦</span>
      <span class="threshold-line" />
    </div>
    <div class="threshold-overline">
      {{ overline }}
    </div>
    <h2 class="threshold-title">
      <MDC
        :value="title"
        unwrap="p"
      />
    </h2>
    <p
      v-if="dek"
      class="threshold-dek"
    >
      <MDC
        :value="dek"
        unwrap="p"
      />
    </p>
  </section>
</template>
