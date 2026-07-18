# Revisión — 18 jul 2026

Revisión global tras cerrar el lote (numeral, enlaces en pestaña nueva, anclas de libro/cine, y el
arquetipo del día de la Parte I). Dos revisores en paralelo: componentes/CSS y contenido/config/tests.
Cada hallazgo se **verificó** antes de actuar (un "ALTA" resultó falso positivo — ver abajo).

## Arreglado en esta revisión

- **Puerta de datos (`tests/data/schema.spec.ts`)** — `pnpm test:data` estaba **roto** (`tests/data/`
  vacío → `vitest` salía con código 1 → `pnpm verify` fallaba siempre). Ahora: `safeParse` de cada
  YAML contra su schema zod, + invariantes (slug==basename, únicos, `order` sin duplicados por
  colección·part), + integridad de anclas `seenIn`. **6 tests, verdes.** Es la puerta que la
  arquitectura ya documentaba (Content v3 no valida `type:'data'` en build) pero que no existía.
- **Puerta en CI** — `deploy.yml` desplegaba corriendo solo `pnpm generate`, sin validar nada. Ahora
  corre `pnpm test:unit && pnpm test:data` **antes** de `generate`: un dato inválido ya no llega a
  producción en silencio.
- **Accesibilidad del índice** — el panel del índice, cerrado en móvil, seguía en el orden de
  tabulación (enlaces invisibles fuera de pantalla enfocables con teclado). Fix CSS con `visibility`
  retrasada, preservando la animación de salida. Desktop (siempre visible) intacto.
- **InversionCard: HTML inválido** — `<MDC>` dentro de `<h3>` metía un `<p>` de bloque en un heading.
  Cambiado a render inline por `v-html` (`inlineTitle`, como DiaCard) + `<h3>`→`<h2>` (coherencia de
  jerarquía con actos/fichas/días). Se retiró el parche CSS `.inversion h3 p` que ya no hace falta.
- **Badge `solo-si`** — no tenía color propio → salía idéntico al de `imprescindible` (oro). Añadida
  la regla en oro suave (sin instancia hoy, pero completa el intento de 4 colores del arquetipo).
- **`:focus-visible` en enlaces del día** — añadido para igualar el de las fichas.
- **`tests/README.md`** — describía la puerta de paridad-pixel de guiaRoma (56 PNG golden, Playwright)
  que **aquí no existe**. Reescrito al estado real.

## Verificado y correcto (NO tocar)

- **Falso positivo — `.lede` del hero.** Un revisor predijo por analogía que perdía su clase al
  hidratar (como `.acto-body`). **Verificado en el DOM: la conserva** (1.2rem, `max-width:60ch`). El
  `.acto-body` la pierde porque usa `<MDC>` *sin* unwrap tras un hermano unwrap; el `.lede` usa unwrap
  y no es víctima. (La sesión de hidratación sí lo pasa a `inlineMd` para limpiar el *warning*, que es
  otra cosa que el class-loss.)
- DiaCard y GuideIndex **no** reintroducen el bug de hidratación (DiaCard sin ningún `unwrap`;
  GuideIndex sin MDC, todo en `onMounted`). Scroll-spy robusto (tolera IDs inexistentes, listeners
  limpiados, sin mismatch SSR). ThemeToggle y useTrip correctos para SSG. Los 30 YAML pasan zod;
  fechas y cifras internamente consistentes (Trung Thu 25 sep, equinoccio 22-23 sep, día 13 = mié 23).

## Diferido (con motivo) — hoja de ruta

- **Cross-links muertos (3).** `FichaCard` pinta **todos** los `seenIn` como `<span>`, aunque 3
  destinos ya existen en la página: metropole↔hanoi-cine-libros y minorias-norte→loop-ha-giang. Para
  hacerlos enlaces hay que pintar el chip condicional (`<a>` si el slug existe, `<span>` si no),
  pasándole el set de slugs. **Diferido a después de tener la puerta de anclas** (ya está) — es el
  siguiente paso seguro, pequeño, en FichaCard.
- **Convención lugar-vs-ficha.** Los chips apuntan a `#angkor-wat` / `#bayon`, pero las fichas existen
  con slug `angkor-wat-geometria` / `el-bayon`. Decidir: ¿esos ids los dará una **tarjeta-lugar** de la
  Parte I, o los chips deben repuntar a la ficha existente? Fijarlo antes de escribir las fichas de
  lugar para no acabar con dos tarjetas del mismo monumento sin enlazar.
- **23 anclas de lugar pendientes** — inventario de fichas de monumento/sitio de la Parte I por
  escribir (Angkor Wat, Bayon, Ta Prohm, Banteay Srei, Trang An, Hang Mua, Hoa Lo, memorial McCain,
  Bamboo Bar, Bún chả Hương Liên…). Viven en `PENDING_ANCHORS` de `schema.spec.ts`; el test avisa
  cuando una se cree.
- **Consolidar el render inline de markdown.** La sesión de hidratación creó `app/utils/inline-md.ts`
  (`inlineMd`, auto-importado) y lo usa en ActoCard/Threshold/TripView/FichaCard. Cuando ese branch se
  mergee, **DiaCard e InversionCard deben cambiar su `inlineTitle` local por `inlineMd`** (4 copias →
  1). Igual con `stripMd` y `nav` de TripView → extraer a `app/utils/` y testear en `tests/unit`
  (prioridad: `inlineMd`, por alimentar un `v-html`).
- **Andamiaje muerto de guiaRoma:** `playwright.config.ts` (apunta a `tests/parity/` inexistente),
  el ignore de eslint de `tests/parity/**`, y los comentarios `/guiaRoma/` en `app/app.vue` (el código
  funciona; solo el comentario miente). Limpiar o marcar como v2.
- **Grupo "Vietnam" del índice sin guarda** — se añade incondicionalmente mientras Camboya/Plan van con
  guarda. Para "añadir un viaje = añadir ficheros", derivar los grupos de datos en vez de hardcodear
  "Vietnam"/"Camboya". Menor (un solo viaje hoy).
- Nimiedades: clases `gi-item--{kind}` sin CSS que las use (hook futuro o borrar); `.ficha-epithet p`
  regla muerta.

## Estrategia de tests

1. **Hecho — puerta de datos** (`schema.spec.ts`) + gate en CI. Tapa el agujero DATA-05.
2. **Extraer y testear helpers puros** (`inlineMd`, `stripMd`, `nav`) en `tests/unit` — al mergear la
   sesión de hidratación (que ya crea `inlineMd`). Alto valor el de `inlineMd` (alimenta `v-html`).
3. **Componentes Vue con `@vue/test-utils`: diferir.** Hoy son de presentación (v-for + MDC), poca
   lógica; la que merece test es pura y va a unit. Primer candidato a montaje real: el scroll-spy de
   GuideIndex — y aun ese cabe en unit si se extrae la función.

## Coordinación

La **sesión de hidratación** (worktree aislado) arregla el bug de `<MDC unwrap>` en ActoCard,
Threshold, TripView (hero) y FichaCard con el nuevo `app/utils/inline-md.ts`. Su código **aún no está
en `main`**. Al mergear habrá que resolver el solape en `TripView.vue` (ella tocó el hero; yo, la
Parte I — regiones distintas) y consolidar los `inlineTitle` locales de DiaCard/InversionCard.
