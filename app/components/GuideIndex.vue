<script setup lang="ts">
// GuideIndex — el índice flotante de la guía (patrón long-read tipo revista).
//  · En desktop (≥1200px) vive fijo en el margen izquierdo, con scroll-spy: resalta el acto/ficha
//    en el que estás según bajas, y su grupo. Doble función: navegar + «estás aquí».
//  · En estrecho/móvil se pliega en un panel deslizante que abre el botón «Índice» de la cabecera.
// El scroll-spy es por posición (el último ancla por encima de una línea bajo la cabecera): simple,
// predecible y sin dependencias. Todo corre en cliente (onMounted) → sin desajuste de hidratación.
export interface NavItem { id: string, label: string, numeral?: string, kind: 'acto' | 'ficha' | 'inversion' | 'dia' | 'reco' }
export interface NavGroup { key: string, label: string, anchor: string, items: NavItem[] }

const props = defineProps<{ groups: NavGroup[], open: boolean }>()
const emit = defineEmits<{ close: [] }>()

// Lista de anclas en orden de documento, cada una con su grupo. Incluye los anclas de grupo
// (umbrales de Camboya / Parte I) para que el resaltado del grupo cambie justo al cruzarlos.
const spy = computed(() => {
  const out: { id: string, group: string, isItem: boolean }[] = []
  for (const g of props.groups) {
    if (g.anchor && g.anchor !== 'top') out.push({ id: g.anchor, group: g.key, isItem: false })
    for (const it of g.items) out.push({ id: it.id, group: g.key, isItem: true })
  }
  return out
})

const activeId = ref('') // ítem resaltado
const activeGroup = ref('') // grupo resaltado

let ticking = false
function recompute() {
  ticking = false
  const line = 130 // px bajo el borde superior: la sección «actual» es la última que lo cruza
  let curItem = '', curGroup = ''
  for (const s of spy.value) {
    const el = document.getElementById(s.id)
    if (!el) continue
    if (el.getBoundingClientRect().top <= line) {
      curGroup = s.group
      curItem = s.isItem ? s.id : ''
    } else break // en orden de documento → la primera por debajo de la línea corta el barrido
  }
  activeId.value = curItem
  activeGroup.value = curGroup
}
function onScroll() {
  if (!ticking) { ticking = true; requestAnimationFrame(recompute) }
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  window.addEventListener('keydown', onKey)
  recompute()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  window.removeEventListener('keydown', onKey)
})

// El salto (scroll con offset) y el historial los gestiona plugins/anchor-nav.client.ts vía Vue
// Router, común a todos los enlaces internos. Aquí solo cerramos el panel deslizante (móvil).
</script>

<template>
  <nav
    class="guide-index"
    :class="{ 'is-open': open }"
    aria-label="Índice de la guía"
  >
    <div
      class="gi-backdrop"
      @click="emit('close')"
    />
    <div class="gi-panel">
      <div class="gi-head">
        <span class="gi-head-label">Índice</span>
        <button
          class="gi-close"
          type="button"
          aria-label="Cerrar índice"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>
      <div class="gi-scroll">
        <div
          v-for="g in groups"
          :key="g.key"
          class="gi-group"
          :class="{ 'is-active': g.key === activeGroup }"
        >
          <a
            class="gi-glabel"
            :href="g.anchor === 'top' ? '#' : '#' + g.anchor"
            @click="emit('close')"
          >{{ g.label }}</a>
          <ul class="gi-items">
            <li
              v-for="it in g.items"
              :key="it.id"
              class="gi-item"
              :class="['gi-item--' + it.kind, { 'is-active': it.id === activeId }]"
            >
              <a
                :href="'#' + it.id"
                :title="it.label"
                @click="emit('close')"
              >
                <span
                  v-if="it.numeral"
                  class="gi-num"
                >{{ it.numeral }}</span>
                <span
                  v-else
                  class="gi-mark"
                  aria-hidden="true"
                >◆</span>
                <span class="gi-label">{{ it.label }}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </nav>
</template>
