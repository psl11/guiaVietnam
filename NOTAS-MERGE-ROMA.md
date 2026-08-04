# Notas para el día que se revive la migración Nuxt de guiaRoma (PR #8)

**Qué es esto.** guiaVietnam se bifurcó de la migración Nuxt de guiaRoma (`release/nuxt-4-pr`, PR #8 — sin mergear ni desplegar). Al construir y **desplegar de verdad** Vietnam, salen a la luz cosas que la migración de Roma **no puede haber probado**, porque su gate de paridad corre en local (`pnpm verify` sobre 56 PNGs golden) pero **nunca llegó a desplegarse**. Este fichero acumula lo aprendido en Vietnam que habrá que **verificar o aplicar en Roma el día que se retome** ese PR.

> Regla de oro: el Roma **VIVO** es el `index.html` a pelo (Pages `build_type: legacy`, sirviendo `main` desde `/`). NADA de aquí le afecta hoy. Todo esto es para la migración Nuxt cuando se revive.

---

## A. Cosas que Roma-Nuxt NECESITARÁ para desplegar (nunca las tuvo)

1. **CI de despliegue.** El PR #8 no tiene `.github/workflows/`. Copiar el `deploy.yml` de Vietnam (pnpm install + `pnpm generate` + `upload-pages-artifact` + `deploy-pages`). **Cambiar el baseURL**: Roma ya usa `/guiaRoma/` en su `nuxt.config.ts`, así que el `pnpm generate` sale bien sin tocar env. *(Verificado: el mismo flujo despliega Vietnam.)*
2. **Pages en modo workflow.** Hay que cambiar `guiaRoma` de `build_type: legacy` → `workflow` (`gh api -X POST repos/psl11/guiaRoma/pages -f build_type=workflow`, o PUT si ya existe). El repo ya es público. **Ojo**: al hacerlo, Pages deja de servir el `index.html` viejo y pasa a servir el Nuxt — es el momento en que la migración "va en vivo". No hacerlo hasta estar seguro.
3. **`better-sqlite3` compila en CI.** El stack (Content v3) necesita build nativo; `pnpm install --frozen-lockfile` con `onlyBuiltDependencies: [better-sqlite3]` lo construye solo en el runner. *(Verificado en Vietnam.)*
4. **Node 20 deprecado en las actions.** Los `actions/checkout@v4`, `setup-node@v4`, etc. avisan de Node 20 (GitHub lo va a quitar). Bump a versiones con Node 24 cuando salgan, o aceptar el warning (no rompe hoy).
5. **Propagación del CDN.** Tras el deploy, GitHub Pages tarda ~1 min en propagar por Fastly; `curl` puede seguir sirviendo la versión anterior un rato. No es un bug: esperar y reverificar. (Los query params NO bustean su caché.)

## B. Latentes a VERIFICAR (el gate de paridad podría no cazarlos)

6. **Mismatch de hidratación por `<MDC unwrap="p">`.** En Vietnam, un `<div class="X"><MDC/></div>` (MDC SIN unwrap) **perdía la clase X al hidratar** cuando le precedía un hermano con `<MDC unwrap="p">` (el unwrap emite un fragmento `<!--[-->` que desincroniza el índice de hidratación del hermano siguiente). Se manifestó como pull-quotes sin estilo. **En Roma el grep de ese patrón (`<div class="…"><MDC>` sin unwrap) salió VACÍO**, así que probablemente no le afecta — pero al desplegar Roma-Nuxt conviene **abrir la consola y buscar warnings de "hydration mismatch" de Vue**, porque el golden se captura post-hidratación y un class-loss que no cambie el aspecto visible NO lo caza. Fix si aparece: targetear un ancestro estable (p.ej. `.acto` en vez de `.acto-body`), no la clase del wrapper del MDC.

## C. Lo que NO aplica a Roma (para no perder el tiempo)

- El **subset de fuentes vietnamitas** (U+1EA0–1EF9): Roma es italiano/español, no lo necesita.
- Los **chips "dónde lo veréis" como `<span>`**: en Vietnam apuntan a una Parte I que aún no existe; en Roma los destinos (monumentos) están en la misma página, así que siguen siendo `<a>` válidos.
- El **favicon "V"**: el de Roma ("R") es correcto para Roma.

## D. El offline estaba roto en las DOS guías (29 jul 2026) — aplicar a Roma sin falta

Descubierto porque las dos guías dieron un **500 de Nuxt en un avión**. Tres fallos encadenados y
**ninguno visible con cobertura**: la web funciona perfecta online, así que nada avisa. Roma-Nuxt
hereda la misma configuración de `@vite-pwa/nuxt`, así que le pasará igual.

1. **El SW no se instalaba nunca.** Nuxt genera `200.html` y `404.html` (fallback de GitHub Pages) y
   workbox los mete en el manifiesto **sin extensión** (`/guiaVietnam/200`), URL que no existen. Como
   `precacheAndRoute` usa `addAll()`, **una petición fallida aborta la instalación entera**: se
   cacheaban 8 de 166 entradas y el SW no llegaba a `active`.
   → `globIgnores: ['**/200.html', '**/404.html']`
2. **El payload no se encontraba en caché.** Nuxt lo pide con query de build
   (`_payload.json?<uuid>`) y workbox lo guarda sin query.
   → `ignoreURLParametersMatching: [/.*/]`
3. **El contenido no se podía leer.** Content v3 usa SQLite en WASM (2 × 836 KB) y `wasm` no estaba
   en `globPatterns`. Los `sql_dump.txt` sí, el motor no.
   → añadir `wasm` a `globPatterns`

**Ya hay puerta automática: `scripts/check-offline.mjs`**, que corre en el `deploy.yml` justo antes
de publicar y falla con código 1 si vuelve a pasar cualquiera de las tres. Mira el `sw.js` generado
—que es donde vive el fallo y donde ningún test de datos llega— y está probada contra los tres bugs
reales: se reintrodujo cada uno y los cazó. **Copiarla a Roma junto con los tres arreglos.**

**Y la comprobación manual**, para cuando se toque el service worker: `pnpm generate`, servir
`.output/public` bajo el subpath real, cargar, esperar a que el SW esté `active`, **matar el
servidor** y recargar. Si sale el 500, no hay offline.

**Verificado en producción** (29 jul 2026): las 166 entradas devuelven 200 en el servidor real, el SW
llega a ACTIVO con las 166 —antes 8 sin activar— y desde caché salen el shell, el payload con query
inventado, el wasm de SQLite y las fotos.

## E. Nivelación con guiaJapon (29 jul 2026)

Portados desde Japón, que iba por delante: `app/utils/inline-md.ts`, `tests/unit/inlineMd.spec.ts` y
`tests/data/inline-md-subset.spec.ts`. Y `ComidaCard`/`PlatoCard` pasan `veg` y `dondeMejor` por
`inlineMd`: se pintaban con interpolación cruda y enseñaban los asteriscos.

**Ojo al mergear la rama de hidratación**: ella también crea `app/utils/inline-md.ts`. Es el mismo
fichero y el conflicto debería ser trivial, pero hay que mirarlo — y de paso hacer lo que la sección
de diferidos ya pedía: consolidar los `inlineTitle` locales de DiaCard e InversionCard.

## F. Desbordamiento en móvil (29 jul 2026) — también aplica a Roma

En la gastronomía de Japón el body sacaba **37 px de scroll horizontal a 375 px**. La causa no era el
contenido largo sino una pareja de propiedades en los chips que lo llevan: **`white-space: nowrap` +
`flex-shrink: 0`**. Juntas impiden partir línea Y encoger, así que un valor largo estira su fila flex
por encima de la pantalla. **En escritorio no se ve**, por eso llevaba meses ahí.

Afectaba a `.comida-badge`, `.inversion-badge`, `.dia-btime` y `.reco-status` — los cuatro reciben
texto libre. Roma comparte el CSS base, así que hereda el problema.

- Los cuatro chips: `flex-shrink: 1; min-width: 0; max-width: 100%; overflow-wrap: anywhere` y fuera
  el `nowrap`. Solo es seguro mantenerlo si además trunca con `text-overflow: ellipsis`.
- `.ficha-head > *:not(.ficha-emblem) { min-width: 0 }` — sin eso la columna de texto no puede
  encoger por debajo de su palabra más larga y desborda a 320 px.
- `@media (max-width: 560px)`: `.comida-head`, `.plato-head` e `.inversion-head` se apilan.
- Regla global `overflow-wrap: break-word` en `p, li, td…`: un token indivisible más ancho que su
  columna rompe la caja igual (aquí fue `ticket.angkorenterprise.gov.kh`, 236 px en una de 209).

**Puerta:** `tests/unit/cssOverflow.spec.ts` comprueba la causa de forma estática. **La medición real
es en el navegador a 320 y 375 px**, contando elementos con `scrollWidth > clientWidth` o borde
derecho fuera del viewport. Antes: 37 px y 116 elementos. Después: cero y cero.

## G. Campo `dormir` en los días (29 jul 2026)

Añadido a `DiaSchema`: `dormir: { lugar, ref? }`, que `DiaCard` pinta como línea de cierre («Esta
noche · Hanói · casco viejo»), enlazando a su reco de dormir.

**El porqué**, que es lo que hay que replicar en las demás guías: las fichas de dormir tenían las
fechas en su `note` («Noches 12·13·21·24 sep»), así que la información *estaba*. Pero no donde se
usa: sobre la marcha abres el día, en el móvil y a veces sin cobertura, y quieres la cama de esta
noche — no cruzar fechas entre dos secciones. Seis de los dieciséis días ni siquiera la mencionaban
en la prosa.

`ref` se valida en `tests/data/schema.spec.ts` junto a los `seenIn`; probado rompiendo un ancla a
propósito para confirmar que falla. Las noches sin cama (vuelo de ida y de vuelta) llevan `lugar`
sin `ref` y se pintan sin enlace.

**Vale la pena en Japón todavía más**, porque allí se duerme en dos barrios distintos de Tokio
—Akihabara las cinco primeras noches, Shinjuku las cinco últimas— y «dónde dormís» no es un sitio
fijo. Está anotado como trampa en su CLAUDE.md.

---

*Actualizar este fichero conforme aparezcan más cosas al construir Vietnam. Ver [[plataforma-guias-nuxt]] en memoria.*
