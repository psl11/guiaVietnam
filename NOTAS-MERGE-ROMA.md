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

---

*Actualizar este fichero conforme aparezcan más cosas al construir Vietnam. Ver [[plataforma-guias-nuxt]] en memoria.*
