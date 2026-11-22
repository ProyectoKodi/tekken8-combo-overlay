export interface Combo {
  id: string
  notation: string
  notationImages: string[]
  damage: number
  hits: number
  version: string
  creator: string
  source?: string
  notes: string
  customNote?: string
  tags: string[]
  character: string
  difficulty?: 'facil' | 'media' | 'dificil'
  hash?: string
  isNew?: boolean
  isCustom?: boolean
  isLearned?: boolean // <--- NUEVO
  createdAt?: string
}

export type SortKey = 'damage' | 'hits' | 'default'

export interface FilterState {
  activeTags: string[]
  sort: SortKey
  searchQuery: string
  showOnlyFavorites: boolean
  showOnlyLearned: boolean // <--- NUEVO
  minDamage: number
  difficulty: '' | 'facil' | 'media' | 'dificil'
}

export const FAVORITES_SEPARATOR = { id: '__favorites_sep__' } as const
export type FavoritesSeparator = typeof FAVORITES_SEPARATOR
/** Vista especial: favoritos de todos los personajes en una lista. */
export const ROUTINE_ID = '__routine__'
/** Separador con rótulo para listas mezcladas (p. ej. "Mi rutina"). */
export interface ListSeparator { id: string; label: string }
export function makeSeparator(label: string): ListSeparator { return { id: `__sep__${label}`, label } }
export type ComboListItem = Combo | FavoritesSeparator | ListSeparator
export function isSeparator(item: ComboListItem): item is FavoritesSeparator | ListSeparator {
  return item.id.startsWith('__sep')
}

export interface FetchResult {
  combos: Combo[]
  fromCache: boolean
  fetchedAt?: number
  nuevos?: number
}

export const ALL_TAGS = ['Heat', 'Wall', 'Rage', 'CH', 'Crouch', 'Standing', 'No Wall']

/**
 * Clave de comparación de nombres de personaje: insensible a mayúsculas,
 * puntuación ("Roger Jr." ≡ "Roger Jr") y espacios múltiples. La usan el
 * descubrimiento de personajes y la dedupe del grid.
 */
export function normalizeCharName(name: string): string {
  // Solo letras y dígitos: "Roger Jr." ≡ "Roger Jr" ≡ "rogerjr",
  // "Miary-Zo" ≡ "Miary Zo"
  return name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

export const TAG_LABELS_ES: Record<string, string> = { Heat: 'Heat', Wall: 'Pared', Rage: 'Rage', CH: 'Counter', Crouch: 'Agachado', Standing: 'De pie', 'No Wall': 'Sin pared' }
export const DIFFICULTY_LABELS_ES: Record<string, string> = { facil: 'Fácil', media: 'Media', dificil: 'Difícil' }

export const CHARACTER_SLUGS: Record<string, string> = {
  'Alisa': 'alisa', 'Anna': 'anna', 'Armor King': 'armor-king', 'Asuka': 'asuka',
  'Azucena': 'azucena', 'Bryan': 'bryan', 'Claudio': 'claudio', 'Clive': 'clive',
  'Devil Jin': 'devil-jin', 'Dragunov': 'dragunov', 'Eddy': 'eddy', 'Fahkumram': 'fahkumram',
  'Feng': 'feng', 'Heihachi': 'heihachi', 'Hwoarang': 'hwoarang', 'Jack-8': 'jack8',
  'Jin': 'jin', 'Jun': 'jun', 'Kazuya': 'kazuya', 'King': 'king', 'Kuma': 'kuma',
  'Lars': 'lars', 'Law': 'law', 'Lee': 'lee', 'Leo': 'leo', 'Leroy': 'leroy',
  'Lidia': 'lidia', 'Lili': 'lili', 'Miary-Zo': 'miary-zo', 'Nina': 'nina',
  'Panda': 'panda', 'Paul': 'paul', 'Raven': 'raven', 'Reina': 'reina',
  'Shaheen': 'shaheen', 'Steve': 'steve', 'Victor': 'victor', 'Xiaoyu': 'xiaoyu',
  'Yoshimitsu': 'yoshimitsu', 'Zafina': 'zafina', 'Kunimitsu': 'kunimitsu',
  'Bob': 'bob', 'Roger Jr.': 'roger-jr', 'Yujiro Hanma': 'yujiro-hanma'
}
export const CHARACTER_NAMES = Object.keys(CHARACTER_SLUGS)