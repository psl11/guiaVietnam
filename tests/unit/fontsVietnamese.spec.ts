import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Guardia del subset VIETNAMITA en las fuentes vendorizadas.
 *
 * POR QUÉ EXISTE ESTE TEST. Al bifurcar la plataforma de guiaRoma heredamos un
 * `vendor-fonts.mjs` con `KEEP_SUBSETS = ['latin', 'latin-ext']` — correcto para
 * contenido en español e italiano, silenciosamente roto para el vietnamita.
 *
 * Google parte el latino extendido en dos subsets y deja un AGUJERO:
 *
 *   latin-ext  → …U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF…
 *   vietnamese → U+1EA0-1EF9          ← justo el hueco entre 1E9F y 1EF2
 *
 * En ese hueco viven casi todas las vocales con tono del vietnamita. Con solo
 * latin+latin-ext, "Mã Pí Lèng" sobrevive (ã í è son latino básico) pero
 * "Đồng Văn" (ồ), "Mèo Vạc" (ạ), "phở" (ở) o "Bích Động" (ộ) se parten a media
 * palabra: media en Lora y media en la fuente del sistema.
 *
 * Y NO DA ERROR. No hay tofu, no hay 404, no hay warning: el navegador aplica el
 * fallback y sigue. Es un fallo que solo se ve mirando, y solo si sabes qué mirar
 * — por eso necesita un test y no una revisión visual.
 *
 * Los nombres tonales son el CONTENIDO de esta guía, no decoración: el vietnamita
 * es tonal y el tono no es un acento, es otra palabra. Si esto se rompe, se rompe
 * la premisa.
 *
 * Si este test se pone rojo: `node scripts/vendor-fonts.mjs` y comprobar que
 * `KEEP_SUBSETS` sigue incluyendo 'vietnamese'.
 */

const FONTS_CSS = join(process.cwd(), 'app/assets/css/fonts.css')

/** Rangos unicode declarados para una familia, aplanados a pares [inicio, fin]. */
function rangosDe(css: string, familia: string): Array<[number, number]> {
  const bloques = [...css.matchAll(
    new RegExp(`font-family: '${familia}';[^}]*?unicode-range: ([^;]+);`, 'gs'),
  )].map(m => m[1]!)
  expect(bloques.length, `no hay ninguna @font-face de ${familia} en fonts.css`).toBeGreaterThan(0)
  return bloques.flatMap(b => b.split(',').map((parte) => {
    const hex = parte.trim().replace(/^U\+/i, '')
    const [a, b2] = hex.split('-')
    const ini = parseInt(a!, 16)
    return [ini, b2 ? parseInt(b2, 16) : ini] as [number, number]
  }))
}

const cubre = (rangos: Array<[number, number]>, ch: string) =>
  rangos.some(([a, b]) => ord(ch) >= a && ord(ch) <= b)
const ord = (ch: string) => ch.codePointAt(0)!

/** Los que salen de verdad en la guía. Si añades un topónimo nuevo, súmalo aquí. */
const NOMBRES = [
  'Mã Pí Lèng', 'Đồng Văn', 'Mèo Vạc', 'phở', 'Bích Động', 'Quản Bạ',
  'Hà Giang', 'Tràng An', 'bún chả', 'Nho Quế', 'Lũng Cú', 'Hàng Mã',
  'Hoàn Kiếm', 'Sủng Là', 'cà phê trứng', 'Tết Trung Thu', 'Ninh Bình',
]

describe('fuentes vendorizadas: subset vietnamita', () => {
  const css = readFileSync(FONTS_CSS, 'utf-8')

  it('fonts.css declara caras del subset vietnamita', () => {
    // U+1EA0-1EF9 es la firma del subset. Sin ninguna cara que lo declare, el
    // resto del test no tendría por qué pasar — este assert da el diagnóstico claro.
    expect(css).toContain('1EA0-1EF9')
  })

  for (const familia of ['Lora', 'Cormorant Garamond'] as const) {
    it(`${familia} cubre todos los nombres tonales de la guía`, () => {
      const rangos = rangosDe(css, familia)
      const rotos = NOMBRES.flatMap(n =>
        [...n].filter(c => ord(c) > 0x7F && !cubre(rangos, c))
          .map(c => `${n} → ${c} (U+${ord(c).toString(16).toUpperCase().padStart(4, '0')})`),
      )
      expect(rotos, `${familia} no cubre estos caracteres; regenera con vendor-fonts.mjs`).toEqual([])
    })
  }

  it('el agujero U+1EA0–U+1EF1 de latin-ext queda tapado (la regresión concreta)', () => {
    // ạ U+1EA1 y ộ U+1ED9 caen en el hueco: son los centinelas. Si latin-ext fuera
    // suficiente —la premisa equivocada que heredamos— este test pasaría igual y no
    // valdría nada; por eso comprobamos que hay una cara vietnamese que los cubre.
    const rangos = rangosDe(css, 'Lora')
    for (const ch of ['ạ', 'ộ', 'ở', 'ồ', 'ả']) {
      expect(cubre(rangos, ch), `Lora no cubre ${ch}`).toBe(true)
      expect(ord(ch), `${ch} debería estar en el subset vietnamese`).toBeGreaterThanOrEqual(0x1EA0)
      expect(ord(ch)).toBeLessThanOrEqual(0x1EF9)
    }
  })
})
