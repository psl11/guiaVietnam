// Esquema zod del modelo de la guía de Vietnam — FUENTE ÚNICA DE VERDAD.
//
// Vive en `shared/` (no inline en content.config.ts) porque lo comparten dos consumidores que
// deben usar el MISMO contrato: content.config.ts (genera tipos + columnas SQL de Nuxt Content)
// y los tests de tests/data (la verdadera puerta de validación — Content v3 NO valida los
// `type:'data'` contra zod en build, nuxt/content#3351).
//
// Reglas heredadas de la plataforma (ver memoria [[plataforma-guias-nuxt]]):
//  - `import { z } from 'zod'`, NUNCA el re-export de '@nuxt/content' (deprecado).
//  - El ancla estable es `slug` (= basename del fichero), NUNCA `id` (campo reservado que
//    Content sobrescribe). El campo del hero se llama `heroMeta`, nunca `meta` (también reservado).
//  - Nada de `.refine()` cross-fichero: se pierde al pasar a JSON-Schema. Cross-refs van en tests.
//
// A DIFERENCIA de Roma: aquí NO hay uniones discriminadas (evitamos el workaround del superset
// plano por el que Content v3 no materializa columnas). Cada colección es un `z.object` directo.
// El modelo sale de los dos archetipos de la Parte II validados en el mockup:
//   · ACTO  — narrativa que se lee del tirón (los cinco actos de la historia, el imperio jemer).
//   · FICHA — consulta que se mira antes de una visita (tam giáo, cómo leer un templo, minorías…).
import { z } from 'zod'

// Markdown-inline (o multi-párrafo): se renderiza con <MDC>. **negrita**, *cursiva*, `> citas`,
// listas… El corpus cultural es prosa, así que casi todo el texto es de este tipo.
export const Md = z.string()

// Enlace a otra ficha/lugar por su ancla (#slug) — el "dónde lo veréis".
export const Link = z.object({
  ref: z.string(), // '#angkor-wat' o URL externa
  label: z.string(),
})

// Sección de prosa con encabezado opcional (D-01 de Roma: array ORDENADO, encabezados libres —
// varían por ficha: "El templo-montaña es el Meru", "El vocabulario de piedra"…).
const Section = z.object({
  heading: z.string().optional(),
  body: Md, // markdown, puede tener varios párrafos, listas y citas
})

// ── ACTO narrativo (cinabrio) ────────────────────────────────────────────────
// Se lee del tirón. numeral árabe grande + capitular en el lead + citas destacadas (blockquotes
// dentro del body) + caja "lo veréis sobre el terreno" al final.
export const ActoSchema = z.object({
  slug: z.string(), // 'acto-4-guerra-americana'
  trip: z.string(), // 'vietnam'
  part: z.enum(['vietnam', 'camboya']), // a qué mitad del viaje pertenece
  order: z.number(), // orden dentro de la parte
  numeral: z.string(), // '4' (árabe; NO romano, NO vietnamita — decisión del mockup)
  kicker: z.string(), // 'Historia de Vietnam · acto cuarto de cinco'
  title: Md, // 'La guerra que aquí llaman *«americana»*' (la cursiva va en cinabrio)
  lead: Md, // primer párrafo — recibe la capitular
  body: Md, // resto de la prosa (multi-párrafo; las `> citas` se estilan como pull-quotes)
  connect: z.object({ label: z.string(), body: Md }).optional(), // caja "lo veréis sobre el terreno"
})

// ── FICHA de consulta (índigo, modelo B: cabecera índigo + cuerpo en papel) ──
// Se mira antes de la visita. emblema + epíteto + secciones con título + chips "dónde lo veréis".
export const FichaSchema = z.object({
  slug: z.string(), // 'como-leer-templo-jemer'
  trip: z.string(),
  part: z.enum(['vietnam', 'camboya']),
  order: z.number(),
  emblem: z.string().default('lotus'), // clave del SVG del emblema (ver EMBLEMS en FichaCard)
  kicker: z.string(), // 'Camboya · cómo mirar'
  title: z.string(), // 'Cómo leer un templo jemer'
  epithet: Md.optional(), // la frase-tesis en cursiva bajo el título
  sections: z.array(Section),
  seenIn: z.array(Link).optional(), // "dónde lo veréis" → chips
})

// ── TRIP — metadatos de portada ──────────────────────────────────────────────
export const TripSchema = z.object({
  slug: z.string(), // 'vietnam'
  title: Md, // con *cursiva* para el acento en cinabrio
  eyebrow: z.string(), // 'Vietnam + Camboya · 11–26 sep 2026'
  heroMeta: z.string().optional(),
  quote: z.string().optional(),
  quoteAttr: z.string().optional(),
  lede: Md.optional(), // párrafo de entrada de la Parte II
})

// ── Tipos TS derivados (una sola fuente de verdad) ────────────────────────────
export type Acto = z.infer<typeof ActoSchema>
export type Ficha = z.infer<typeof FichaSchema>
export type Trip = z.infer<typeof TripSchema>
