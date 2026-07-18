# Tests — la puerta de validación

La guía es un sitio **estático** (Nuxt SSG → GitHub Pages). No hay runtime en producción, así que la
verificación se concentra en dos cosas: que los **datos** del contenido sean válidos, y que la
**tipografía** (subset vietnamita) esté vendorizada. Ambas corren en Vitest y son la puerta de CI.

> Nota histórica: este proyecto es un **fork** de la migración Nuxt de guiaRoma, que tenía una puerta
> de *paridad-pixel* (Playwright + 56 PNG golden contra el `index.html` vivo). **Aquí NO aplica** —
> guiaVietnam es una guía nueva, sin `index.html` de referencia. `playwright.config.ts` y la carpeta
> `tests/parity/` son andamiaje muerto heredado (pendiente de limpiar; ver `REVISION.md`).

---

## El comando: `pnpm verify`

```
pnpm generate && pnpm test:unit && pnpm test:data
```

Construye la salida estática y luego corre las dos capas. **CI corre `test:unit && test:data` ANTES
de `generate`** (`.github/workflows/deploy.yml`) para no desplegar datos inválidos.

| Capa | Script | Qué verifica | Runner |
|------|--------|--------------|--------|
| unit | `pnpm test:unit` | `tests/unit/**` — helpers puros y regresiones invisibles. Hoy: `fontsVietnamese.spec.ts`, que garantiza que el subset `vietnamese` (U+1EA0–1EF9) esté declarado en `fonts.css` para que los nombres tonales (`Mèo Vạc`, `Bích Động`, `phở`) no se partan a media palabra. | Vitest |
| data | `pnpm test:data` | `tests/data/**` — **la puerta de datos**. `schema.spec.ts`: `safeParse` de cada YAML contra su schema zod de `shared/schemas.ts`, + invariantes (slug == basename, slugs únicos, `order` sin duplicados por colección·part) + **integridad de anclas** `seenIn`. | Vitest |

`vitest.config.ts` incluye `tests/data/**` y `tests/unit/**`; los scripts los corren por separado.

### Por qué `test:data` es imprescindible

**Nuxt Content v3 NO valida las colecciones `type:'data'` contra zod en build** (nuxt/content#3351):
un enum inválido (`verdict: caro`) o un campo requerido ausente se desplegaría **en silencio**. El
build no lo cataría (`failOnError` solo cubre enlaces de ruta rotos, y aquí toda la navegación es por
ancla). Por eso la validación real es este test Node-puro que hace `safeParse` por fichero — nunca vía
el runtime de Content, que "limpiaría" los datos inválidos y ocultaría el fallo.

### Integridad de anclas

`schema.spec.ts` clasifica cada `seenIn[].ref` en **resuelve** (existe una ficha con ese slug) o
**pendiente** (`PENDING_ANCHORS`: fichas de lugar/monumento de la Parte I aún no escritas — los chips
se pintan como `<span>`, no `<a>`, hasta que existan). El test falla si:
- una ref no resuelve **ni** está en la allowlist → typo o ficha nueva sin declarar;
- una ancla de la allowlist **ya existe** como slug → recordatorio de quitarla de `PENDING_ANCHORS`
  y convertir su chip en enlace (ver `REVISION.md`, hallazgo de cross-links).

Así, `PENDING_ANCHORS` es a la vez red de seguridad y **inventario de lo que falta por escribir**.

---

## Añadir tests

- **Datos**: normalmente no hay que tocar nada — `schema.spec.ts` descubre viajes, colecciones y
  ficheros solo. Al crear una ficha de lugar, quitar su ancla de `PENDING_ANCHORS`.
- **Helpers puros**: a `tests/unit/`. Candidatos actuales a extraer y testear: el render inline de
  markdown (`inlineMd`), `stripMd` y la construcción de `nav` de `TripView` (ver `REVISION.md`).
- **Componentes Vue**: diferido. Hoy son de presentación (poca lógica); montar `@vue/test-utils`
  todavía no compensa. La lógica que merece test es pura y va a `tests/unit`.
