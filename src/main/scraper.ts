import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'
import type { Combo } from '../renderer/types/combo'
import { makeComboId } from '../shared/comboHash.ts'

const BASE_URL = 'https://tekken8combo.kagewebsite.com'

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, { headers: FETCH_HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  return res.text()
}

/** Exportado para poder testearlo contra HTML real guardado como fixture. */
export function parseCombosFromHtml(html: string, character: string): Combo[] {
  const $ = cheerio.load(html)
  const combos: Combo[] = []

  const entries = $('li.combo-item')

  entries.each((_, el) => {
    try {
      const combo = parseComboEntry($, el, character)
      if (combo) combos.push(combo)
    } catch {
      // skip malformed entries
    }
  })

  return combos
}

function parseComboEntry(
  $: cheerio.CheerioAPI,
  el: AnyNode,
  character: string
): Combo | null {
  const $el = $(el)

  const $notationEl = $el.find('.comboTxt').first()
  const notationImages: string[] = []
  let notation = $notationEl.text().trim()
  if (!notation || notation.length < 3) return null

  let version = ''
  $el.find('p.comboBadges').first().find('span.badge').each((_, badge) => {
    const $b = $(badge)
    const strong = $b.find('strong').text().trim()
    if (/^v\d+\.\d+/i.test(strong)) {
      version = strong
      return false
    }
  })

  let hits = 0
  let damage = 0
  $el.find('p.comboBadges').first().find('span.badge').each((_, badge) => {
    const $b = $(badge)
    const cls = ($b.attr('class') ?? '').trim()
    if (cls !== 'badge') return
    const txt = $b.text().trim()
    const hitsMatch = txt.match(/^(\d+)\s*hits?$/i)
    const dmgMatch  = txt.match(/^(\d+)\s*damages?$/i)
    if (hitsMatch) hits   = parseInt(hitsMatch[1], 10)
    if (dmgMatch)  damage = parseInt(dmgMatch[1],  10)
  })

  const tags: string[] = []
  $el.find('p.comboBadges').first().find('span.badge').each((_, badge) => {
    const $b    = $(badge)
    const cls   = ($b.attr('class') ?? '').replace('badge', '').trim()
    const txt   = $b.text().replace(/\s+/g, ' ').trim()
    const hasStrong = $b.find('strong').length > 0

    if (cls === 'blue')   { if (!tags.includes('Heat')) tags.push('Heat') }
    else if (cls === 'green') {
      const label = txt || 'Wall'
      if (!tags.includes(label)) tags.push(label)
    }
    else if (cls === 'red' && !hasStrong) {
      if (!tags.includes('Rage')) tags.push('Rage')
    }
    else if (cls === 'yellow') {
      if (!tags.includes('CH')) tags.push('CH')
    }
  })

  const $badgeSections = $el.find('p.comboBadges')
  if ($badgeSections.length >= 2) {
    $badgeSections.eq(1).find('span.badge.orange').each((_, badge) => {
      const $b = $(badge)
      const stageName = $b.find('strong').text().trim()
      if (stageName) {
        const stageTag = `Stage: ${stageName}`
        if (!tags.includes(stageTag)) tags.push(stageTag)
      }
    })
  }

  let creator = ''
  const creatorLink = $el.find('a[href*="/user/"]').first()
  if (creatorLink.length) creator = creatorLink.text().trim()

  let notes = ''
  const noteEl = $el.find('.note, [class*="note"]').first()
  if (noteEl.length) notes = noteEl.text().trim()

  // Vídeo del combo: YouTube enlazado/incrustado en la ficha del sitio
  let source = ''
  const $video = $el.find('a[href*="youtu"], iframe[src*="youtu"]').first()
  if ($video.length) source = ($video.attr('href') || $video.attr('src') || '').trim()

  return {
    id: makeComboId(character, notation, creator),
    notation,
    notationImages,
    damage,
    hits,
    version,
    creator,
    notes,
    tags,
    character,
    source,
  }
}

/** Exportado para poder testearlo contra HTML real guardado como fixture. */
export function extractNextPageUrl(html: string, currentUrl: string): string | null {
  const $ = cheerio.load(html)

  const pageMatch = currentUrl.match(/page=(\d+)/)
  const currentPage = pageMatch ? parseInt(pageMatch[1], 10) : 1

  let nextUrl: string | null = null
  $('a').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (href.includes(`page=${currentPage + 1}`)) {
      nextUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`
    }
  })

  return nextUrl
}

// --- AQUI ESTA EL CAMBIO CLAVE ---
// Recibimos el 'slug' (el enlace real) Y el 'character' (el nombre original)
export async function scrapeCharacterCombos(
  slug: string,
  character: string
): Promise<Combo[]> {
  // Si por alguna razón llega sin nombre, lo deducimos del slug
  const charName = character || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  let allCombos: Combo[] = []
  let url = `${BASE_URL}/combos-${slug}/` // Usamos el slug para la URL
  let pageCount = 0
  const MAX_PAGES = 10

  while (url && pageCount < MAX_PAGES) {
    try {
      const html = await fetchPage(url)

      const pageCombos = parseCombosFromHtml(html, charName)
      allCombos = allCombos.concat(pageCombos)

      const nextUrl = extractNextPageUrl(html, url)
      url = nextUrl || ''
      pageCount++

      if (url) await new Promise((r) => setTimeout(r, 300))
    } catch (e) {
      console.error(`Error fetching page ${url}:`, e)
      break // Si falla una página, paramos pero devolvemos lo que tengamos
    }
  }

  allCombos = allCombos.map((c) => ({ ...c, id: makeComboId(c.character, c.notation, c.creator) }))

  return allCombos
}

// -------------------------------------------------
// Descubrimiento de personajes nuevos (DLC)
// -------------------------------------------------

export interface DiscoveredCharacter { name: string; slug: string }

/** Extrae la lista { nombre, slug } del índice `all-combos` de la web. */
export function extractCharacterLinks(html: string): DiscoveredCharacter[] {
  const $ = cheerio.load(html)
  const seen = new Set<string>()
  const out: DiscoveredCharacter[] = []
  $('a[href*="/combos-"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const match = href.match(/\/combos-([a-z0-9-]+)\/?$/)
    if (!match) return
    const slug = match[1]
    if (seen.has(slug)) return
    seen.add(slug)
    // "Kazuya combos" -> "Kazuya"; si el texto no sirve, se deduce del slug
    let name = $(el).text().replace(/combos?/gi, '').replace(/[^\p{L}\p{N}\- ']/gu, '').trim()
    if (!name) name = slug.split('-').map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : '')).join(' ')
    out.push({ name, slug })
  })
  return out
}

/** Baja el índice de la web y devuelve todos los personajes que publica. */
export async function discoverCharacters(): Promise<DiscoveredCharacter[]> {
  const html = await fetchPage(`${BASE_URL}/all-combos/`)
  return extractCharacterLinks(html)
}