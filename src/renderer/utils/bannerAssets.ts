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

export const RANK_ART = toSlugMap(rankFiles)
export const PORTRAITS = toSlugMap(portraitFiles)
export const BACKGROUNDS = Object.values(toSlugMap(backgroundFiles)).sort()

export const bannerRankArt = (rank: string): string | null => rankArtUrl(RANK_ART, rank)
export const bannerPortrait = (character: string): string | null => portraitUrl(PORTRAITS, character)
export const bannerBackground = (seed: string): string | null => backgroundFor(seed, BACKGROUNDS)
