import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { parse } from 'yaml'
import type { ZodTypeAny } from 'zod'
import { TripSchema, ActoSchema, FichaSchema, InversionSchema, DiaSchema, RecoSchema } from '../../shared/schemas'

// La PUERTA DE VALIDACIÓN DE DATOS. Nuxt Content v3 NO valida las colecciones `type:'data'` contra
// zod en build (nuxt/content#3351) → un enum inválido o un requerido ausente se desplegaría en
// silencio. Este test lee cada `.yml` y hace `safeParse` con el schema REAL de shared/schemas.ts
// (sin runtime Nuxt ni SQLite, que "limpiarían" los datos y ocultarían el fallo). Es lo que hace de
// `pnpm verify` una puerta de verdad, y el step que CI debe correr antes de `generate`.

const TRIPS = join(__dirname, '../../content/trips')

// "Añadir un viaje = añadir ficheros" también aquí: se descubren los viajes por subdirectorio.
const trips = readdirSync(TRIPS, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)

interface Doc {
  rel: string
  collection: string
  part?: string
  order?: number
  slug?: string
  seenIn?: { ref?: string, label?: string }[]
}

const COLLECTIONS: { dir: string, schema: ZodTypeAny, name: string, single?: boolean }[] = [
  { dir: '', schema: TripSchema, name: 'trip', single: true }, // trip.yml (raíz del viaje)
  { dir: 'actos', schema: ActoSchema, name: 'acto' },
  { dir: 'fichas', schema: FichaSchema, name: 'ficha' },
  { dir: 'inversiones', schema: InversionSchema, name: 'inversion' },
  { dir: 'dias', schema: DiaSchema, name: 'dia' },
  { dir: 'recos', schema: RecoSchema, name: 'reco' },
]

// Anclas de LUGAR pendientes: fichas de monumento/sitio (Parte I) aún no escritas. Los chips
// `seenIn` que apuntan aquí se pintan como <span> (no <a>) hasta que exista la ficha. Cuando una se
// cree (su slug aparezca), el test "allowlist no obsoleta" falla para recordar convertir el chip en
// enlace. Mantener en sync con el contenido — es también el inventario de lo que falta por escribir.
const PENDING_ANCHORS = new Set([
  'angkor-wat', 'bayon', 'ta-prohm', 'banteay-srei',
  'phare-circo', // 'cuisine-wat-damnak' ya existe como reco (su chip resuelve) → fuera de la allowlist
  'trang-an', 'hang-mua', 'bich-dong',
  'casa-87-ma-may', 'hang-thiec', 'dinh-kim-ngan',
  'pagoda-tran-quoc', 'templo-ngoc-son', 'phu-tay-ho',
  'hoa-lo', 'memorial-mccain',
  'bamboo-bar', 'museo-etnologia', 'teatro-thang-long', 'ca-tru-hang-bac',
  'bun-cha-huong-lien', 'cafe-giang',
])

const docs: Doc[] = []
const parseErrors: { rel: string, issues: string[] }[] = []

for (const trip of trips) {
  for (const c of COLLECTIONS) {
    const dir = join(TRIPS, trip, c.dir)
    const files = c.single
      ? (existsSync(join(dir, 'trip.yml')) ? ['trip.yml'] : [])
      : (existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.yml')) : [])
    for (const f of files) {
      const rel = `${trip}/${c.dir ? c.dir + '/' : ''}${f}`
      const data = parse(readFileSync(join(dir, f), 'utf-8'))
      const res = c.schema.safeParse(data)
      if (!res.success) parseErrors.push({ rel, issues: res.error.issues.map(i => `${i.path.join('.') || '(root)'}: ${i.message}`) })
      docs.push({ rel, collection: c.name, part: data?.part, order: data?.order, slug: data?.slug, seenIn: data?.seenIn })
    }
  }
}

const slugs = new Set(docs.map(d => d.slug).filter((s): s is string => !!s))

describe('contenido · schema zod', () => {
  it('todos los YAML pasan safeParse contra su schema', () => {
    const report = parseErrors.map(e => `\n${e.rel}\n  ${e.issues.join('\n  ')}`).join('')
    expect(parseErrors, report).toEqual([])
  })
})

describe('contenido · invariantes', () => {
  it('slug == basename del fichero (el ancla estable)', () => {
    const bad = docs.filter(d => d.collection !== 'trip' && d.slug !== basename(d.rel, '.yml'))
    expect(bad.map(d => `${d.rel} (slug: ${d.slug})`)).toEqual([])
  })

  it('slugs únicos en todo el viaje', () => {
    const seen = new Set<string>()
    const dups: string[] = []
    for (const d of docs) {
      if (!d.slug) continue
      if (seen.has(d.slug)) dups.push(d.slug)
      seen.add(d.slug)
    }
    expect(dups).toEqual([])
  })

  it('order sin duplicados dentro de cada (colección · part)', () => {
    const groups: Record<string, number[]> = {}
    for (const d of docs) {
      if (d.collection === 'trip' || d.order == null) continue
      const key = `${d.collection}${d.part ? '·' + d.part : ''}`
      ;(groups[key] ??= []).push(d.order)
    }
    const dups = Object.entries(groups).filter(([, o]) => new Set(o).size !== o.length)
    expect(dups.map(([k, o]) => `${k}: [${o.sort((a, b) => a - b).join(',')}]`)).toEqual([])
  })
})

describe('contenido · integridad de anclas seenIn', () => {
  it('cada ref resuelve a un slug existente o está en la allowlist de pendientes', () => {
    const unknown: string[] = []
    for (const d of docs) {
      for (const l of d.seenIn ?? []) {
        if (typeof l?.ref !== 'string' || !l.ref.startsWith('#')) continue
        const target = l.ref.slice(1)
        if (!slugs.has(target) && !PENDING_ANCHORS.has(target)) unknown.push(`${d.rel}: ${l.ref}`)
      }
    }
    const report = `anclas desconocidas (¿typo, o ficha nueva sin declarar en PENDING_ANCHORS?):\n  ${unknown.join('\n  ')}`
    expect(unknown, report).toEqual([])
  })

  it('la allowlist de pendientes no está obsoleta (ninguna existe ya como slug)', () => {
    const nowReal = [...PENDING_ANCHORS].filter(a => slugs.has(a))
    const report = `estas anclas ya existen como ficha — quítalas de PENDING_ANCHORS y convierte su chip en enlace: ${nowReal.join(', ')}`
    expect(nowReal, report).toEqual([])
  })
})
