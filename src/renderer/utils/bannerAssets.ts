/**
 * Resuelve el arte del banner con Vite: cada WebP se emite como URL con hash,
 * así que el paquete siempre incluye exactamente lo que se usa.
 */
import {
  backgroundFor,
  portraitUrl,
  rankArtUrl,
  toSlugMap,
} from './bannerLookup'
import { slugify, CHARACTER_ART_SLUGS } from './bannerLookup'

/** Slug del arte del personaje según el mapa local (para banner://). */
export function artSlugForCharacter(character: string): string | null {
  if (!character) return null
  const explicit = CHARACTER_ART_SLUGS[character]
  if (explicit) return explicit
  const slug = slugify(character)
  const match = Object.values(CHARACTER_ART_SLUGS).find(
    (k) => k === slug || k.endsWith(`-${slug}`) || k.startsWith(`${slug}-`),
  )
  return match ?? null
}

const backgroundFiles = import.meta.glob('../assets/banner/fondo/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const rankFiles = import.meta.glob('../assets/banner/rango/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const portraitFiles = import.meta.glob('../assets/banner/personaje/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const BACKGROUND_MAP = toSlugMap(backgroundFiles)

const RANK_ART = toSlugMap(rankFiles)
const PORTRAITS = toSlugMap(portraitFiles)

/** Fondos disponibles para el selector del editor. */
export const BACKGROUND_OPTIONS: Array<{ id: string; url: string }> = Object.entries(BACKGROUND_MAP)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([id, url]) => ({ id, url }))

export const bannerRankArt = (rank: string): string | null => rankArtUrl(RANK_ART, rank)
export const bannerPortrait = (character: string): string | null => portraitUrl(PORTRAITS, character)

/**
 * Fondo elegido por el usuario o, si no hay o no existe, uno determinista
 * a partir de la semilla (personaje principal).
 * `preferred === 'custom'` usa la imagen propia del usuario (customUrl).
 */
export function bannerBackground(preferred: string | undefined, seed: string, customUrl?: string): string | null {
  if (preferred === 'custom') return customUrl || null
  if (preferred && BACKGROUND_MAP[preferred]) return BACKGROUND_MAP[preferred]
  return backgroundFor(seed, BACKGROUND_OPTIONS.map((o) => o.url))
}
