/**
 * Lógica pura de resolución de arte del banner (sin Vite, testeable en Node).
 * Los mapas llegan ya resueltos: `slug -> url`.
 */

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/** Convierte `{ '.../rango/tekkengod.webp': url }` en `{ tekkengod: url }`. */
export function toSlugMap(files: Record<string, string>): Record<string, string> {
  const map: Record<string, string> = {}
  for (const [filePath, url] of Object.entries(files)) {
    const file = filePath.split(/[\\/]/).pop() ?? filePath
    map[file.replace(/\.[^.]+$/, '').toLowerCase()] = url
  }
  return map
}

/**
 * Escalera de rangos de Tekken 8, alineada con los emblemas disponibles.
 * `Tekken Lord` se conserva como rango heredado de Tekken 7 porque también
 * tiene arte. `God of Destruction` incluye sus ocho niveles.
 */
export const RANK_ART_SLUGS: Record<string, string> = {
  Beginner: 'beginner',
  '1st Dan': '1stdan',
  '2nd Dan': '2dan',
  Fighter: 'fighter',
  Strategist: 'strategist',
  Combatant: 'combatant',
  Brawler: 'brawler',
  Ranger: 'ranger',
  Cavalry: 'cavalry',
  Warrior: 'warrior',
  Assailant: 'assailant',
  Dominator: 'dominator',
  Vanquisher: 'vanquisher',
  Destroyer: 'destroyer',
  Eliminator: 'eliminator',
  Garyu: 'garyu',
  Shinryu: 'shinryu',
  Tenryu: 'tenryu',
  'Mighty Ruler': 'mightyruler',
  'Flame Ruler': 'flameruler',
  'Battle Ruler': 'battleruler',
  Fujin: 'fujin',
  Raijin: 'raijin',
  Kishin: 'kishin',
  Bushin: 'bushin',
  'Tekken King': 'tekkenking',
  'Tekken Emperor': 'tekkenemperor',
  'Tekken Lord': 'tekkenlord',
  'Tekken God': 'tekkengod',
  'Tekken God Supreme': 'tekkengodsupreme',
  'God of Destruction': 'godofdestruction',
  'God of Destruction I': 'godofdestruction01',
  'God of Destruction II': 'godofdestruction02',
  'God of Destruction III': 'godofdestruction03',
  'God of Destruction IV': 'godofdestruction04',
  'God of Destruction V': 'godofdestruction05',
  'God of Destruction VI': 'godofdestruction06',
  'God of Destruction VII': 'godofdestruction07',
  'God of Destruction VIII': 'godofdestruction08',
}

export const TEKKEN_RANKS: string[] = Object.keys(RANK_ART_SLUGS)

export function rankArtUrl(map: Record<string, string>, rank: string): string | null {
  if (!rank) return null
  const slug = RANK_ART_SLUGS[rank] ?? slugify(rank)
  return map[slug] ?? null
}

/** Los nombres de la app no coinciden con los archivos: mapa explícito. */
export const CHARACTER_ART_SLUGS: Record<string, string> = {
  Alisa: 'alisa-bosconovitch',
  Anna: 'anna-williams',
  'Armor King': 'armor-king',
  Asuka: 'asuka-kazama',
  Azucena: 'azucena',
  Bob: 'bob',
  Bryan: 'bryan-fury',
  Claudio: 'claudio-serafino',
  Clive: 'clive-rosfield',
  'Devil Jin': 'devil-jin',
  Dragunov: 'sergei-dragunov',
  Eddy: 'eddy-gordo',
  Fahkumram: 'fahkumram',
  Feng: 'feng-wei',
  Heihachi: 'heihachi-mishima',
  Hwoarang: 'hwoarang',
  'Jack-8': 'jack-8',
  Jin: 'jin-kazama',
  Jun: 'jun-kazama',
  Kazuya: 'kazuya-mishima',
  King: 'king',
  Kuma: 'kuma',
  Kunimitsu: 'kunimitsu',
  Lars: 'lars-alexandersson',
  Law: 'marshall-law',
  Lee: 'lee-chaolan',
  Leo: 'leo-kliesen',
  Leroy: 'leroy-smith',
  Lidia: 'lidia-sobieska',
  Lili: 'lili',
  'Miary Zo': 'miary-zo',
  'Miary-Zo': 'miary-zo',
  Nina: 'nina-williams',
  Panda: 'panda',
  Paul: 'paul-phoenix',
  Raven: 'raven',
  Reina: 'reina',
  'Roger Jr.': 'roger-jr',
  Shaheen: 'shaheen',
  Steve: 'steve-fox',
  Victor: 'victor-chevalier',
  Xiaoyu: 'ling-xiaoyu',
  Yoshimitsu: 'yoshimitsu',
  Zafina: 'zafina',
}

export function portraitUrl(map: Record<string, string>, character: string): string | null {
  if (!character) return null

  const explicit = CHARACTER_ART_SLUGS[character]
  if (explicit && map[explicit]) return map[explicit]

  const slug = slugify(character)
  if (map[slug]) return map[slug]

  // Último recurso: coincidencia por sufijo/prefijo (`Law` -> `marshall-law`)
  const key = Object.keys(map).find((k) => k === slug || k.endsWith(`-${slug}`) || k.startsWith(`${slug}-`))
  return key ? map[key] : null
}

/** Elige un fondo de forma determinista a partir de una semilla. */
export function backgroundFor(seed: string, options: string[]): string | null {
  if (options.length === 0) return null
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return options[Math.abs(hash) % options.length]
}
