import type { Trip, Acto, Ficha } from '~~/shared/schemas'

// `useTrip(slug)` — punto de entrada ÚNICO y tipado de los datos de un viaje.
//
// Agrega las 3 colecciones de Nuxt Content (trip/acto/ficha) en refs tipadas. "Añadir un viaje =
// añadir ficheros" se cumple aquí: cada colección se filtra por su campo `trip`; el propio viaje
// por `slug`. El ancla estable es `slug`, NUNCA el `id` reservado de Content.
//
// SSG/offline: `queryCollection` resuelve EN PRERENDER contra el dump SQLite de build y se sirve
// como asset estático — sin servidor en runtime. NO usar fetch('/content/…') ni useState.
//
// CONTRATO DE TIPOS: las 3 colecciones son `z.object`, así que Content las tipa bien; aun así se
// castea el retorno a los tipos zod de shared/schemas.ts (la misma fuente que valida en tests) por
// coherencia con el resto de la plataforma.
export async function useTrip(slug: string) {
  const [trip, actos, fichas] = await Promise.all([
    useAsyncData(`trip-${slug}`, () => queryCollection('trip').where('slug', '=', slug).first()),
    useAsyncData(`actos-${slug}`, () => queryCollection('acto').where('trip', '=', slug).order('order', 'ASC').all()),
    useAsyncData(`fichas-${slug}`, () => queryCollection('ficha').where('trip', '=', slug).order('order', 'ASC').all()),
  ])

  return {
    trip: trip.data as unknown as Ref<Trip | null>,
    actos: actos.data as unknown as Ref<Acto[]>,
    fichas: fichas.data as unknown as Ref<Ficha[]>,
  }
}
