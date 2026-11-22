import Store from 'electron-store'
import type { Combo } from '../renderer/types/combo'
import { CHARACTER_SLUGS, normalizeCharName } from '../renderer/types/combo'

interface CacheEntry {
  data: Combo[]
  fetchedAt: number
  schemaVersion: number
}

interface CacheSchema {
  combos: Record<string, CacheEntry>
  /** Slug resuelto por nombre de personaje, para no re-descargar el índice web. */
  slugs: Record<string, string>
}

const SCHEMA_VERSION = 1
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

const store = new Store<CacheSchema>({
  name: 'combo-cache',
  defaults: { combos: {}, slugs: {} },
})

export function getCachedCombos(slug: string): Combo[] | null {
  const entry = store.get(`combos.${slug}`) as CacheEntry | undefined
  if (!entry) return null
  if (entry.schemaVersion !== SCHEMA_VERSION) return null
  // Entradas vacías (scrape fallido guardado antes) cuentan como fallo:
  // fuerzan re-scrape y se purgan.
  if (!Array.isArray(entry.data) || entry.data.length === 0) {
    clearCache(slug)
    return null
  }
  // Las entradas caducadas se purgan al vuelo: sin esto quedan en disco
  // (y en memoria) para siempre, engordando el store con cada sync.
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    clearCache(slug)
    return null
  }
  return entry.data
}

export function setCachedCombos(slug: string, data: Combo[]): void {
  const entry: CacheEntry = {
    data,
    fetchedAt: Date.now(),
    schemaVersion: SCHEMA_VERSION,
  }
  store.set(`combos.${slug}`, entry)
}

export function clearCache(slug?: string): void {
  if (slug) {
    const combos = store.get('combos') as Record<string, CacheEntry>
    delete combos[slug]
    store.set('combos', combos)
  } else {
    store.clear()
  }
}

/**
 * Todas las entradas cacheadas (sin importar el TTL): se usa para calcular el
 * progreso de maestría por personaje sin re-scrapear.
 */
export function getAllCachedCombos(): Record<string, Combo[]> {
  const all = store.get('combos') as Record<string, CacheEntry>
  const out: Record<string, Combo[]> = {}
  for (const [character, entry] of Object.entries(all)) {
    // Entradas vacías no cuentan: evita tarjetas con indicador pero sin datos
    if (Array.isArray(entry?.data) && entry.data.length > 0) out[character] = entry.data
  }
  return out
}

/**
 * Antigüedad del caché por personaje (fetchedAt): alimenta el indicador de
 * frescura de la rejilla de personajes.
 */
export function getAllCacheInfo(): Record<string, number> {
  const all = store.get('combos') as Record<string, CacheEntry>
  const out: Record<string, number> = {}
  for (const [character, entry] of Object.entries(all)) {
    // Solo con datos reales: una entrada vacía no debe dar puntito de frescura
    if (entry?.fetchedAt && Array.isArray(entry.data) && entry.data.length > 0) {
      out[character] = entry.fetchedAt
    }
  }
  return out
}

/**
 * Migración de claves de caché antiguas al nombre canónico del roster:
 * descubrimientos legacy guardaron "Roger Jr" / "Miary Zo" cuando el roster
 * dice "Roger Jr." / "Miary-Zo". Mueve los datos y borra la variante.
 */
export function migrateVariantCacheKeys(): void {
  const canonicalNames = new Set(Object.keys(CHARACTER_SLUGS))
  const normToCanonical = new Map(Object.keys(CHARACTER_SLUGS).map((n) => [normalizeCharName(n), n]))
  const all = store.get('combos') as Record<string, CacheEntry>
  let changed = false
  for (const [key, entry] of Object.entries(all)) {
    // "¿Ya canónico?" se decide por el nombre EXACTO (comparar normalizado
    // haría que "Roger Jr" parezca canónico de "Roger Jr.")
    if (canonicalNames.has(key)) continue
    const canonical = normToCanonical.get(normalizeCharName(key))
    if (!canonical) continue // variante sin roster: se deja (TTL la purgará)
    const hasData = Array.isArray(entry?.data) && entry.data.length > 0
    const dest = all[canonical]
    const destHasData = Array.isArray(dest?.data) && dest.data.length > 0
    if (hasData && !destHasData) {
      all[canonical] = { ...entry, fetchedAt: Date.now() }
    }
    delete all[key]
    changed = true
  }
  if (changed) store.set('combos', all)
}

// -------------------------------------------------
// Slug cache
// -------------------------------------------------

export function getCachedSlug(character: string): string | undefined {
  const slug = (store.get('slugs') ?? {})[character]
  // Defensa: solo strings válidas (un valor no-string como el objeto basura
  // que creó la notación de puntos devolvería "combos-[object Object]")
  return typeof slug === 'string' && slug ? slug : undefined
}

export function setCachedSlug(character: string, slug: string): void {
  // Escritura sin dot-paths: `store.set('slugs.Roger Jr.', …)` interpreta el
  // PUNTO del nombre como ruta anidada y corrompe el mapa de slugs.
  const all = { ...(store.get('slugs') ?? {}) } as Record<string, string>
  all[character] = slug
  store.set('slugs', all)
}

/**
 * Reparación del mapa de slugs: elimina valores corruptos (no-string) y
 * canoniza los personajes del roster con sus slugs locales conocidos.
 * Se ejecuta al arrancar; idempotente.
 */
export function repairSlugCache(): void {
  const slugs = { ...((store.get('slugs') ?? {}) as Record<string, unknown>) }
  let changed = false
  for (const [key, value] of Object.entries(slugs)) {
    if (typeof value === 'string' && value) continue
    delete slugs[key] // objeto basura tipo { "": "roger-jr" }
    changed = true
  }
  for (const [name, slug] of Object.entries(CHARACTER_SLUGS)) {
    const cur = slugs[name]
    if (typeof cur !== 'string' || !cur) {
      slugs[name] = slug
      changed = true
    }
  }
  if (changed) store.set('slugs', slugs)
}

/**
 * Reescribe los ids de todas las entradas cacheadas y devuelve el mapa
 * `id antiguo -> id nuevo`. Se usa una sola vez, al migrar desde los ids
 * basados en posición (`personaje-indice`) a los ids estables por contenido.
 */
export function remapAllCachedIds(
  makeId: (character: string, combo: Combo) => string
): Map<string, string> {
  const all = (store.get('combos') ?? {}) as Record<string, CacheEntry>
  const mapping = new Map<string, string>()
  let changed = false

  for (const [character, entry] of Object.entries(all)) {
    if (!entry?.data) continue
    entry.data = entry.data.map((combo) => {
      const nextId = makeId(character, combo)
      if (combo.id !== nextId) {
        mapping.set(combo.id, nextId)
        changed = true
      }
      return { ...combo, id: nextId }
    })
  }

  if (changed) store.set('combos', all)
  return mapping
}
