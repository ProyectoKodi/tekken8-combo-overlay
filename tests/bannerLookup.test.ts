import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import {
  CHARACTER_ART_SLUGS,
  RANK_ART_SLUGS,
  TEKKEN_RANKS,
  backgroundFor,
  portraitUrl,
  rankArtUrl,
  slugify,
  toSlugMap,
} from '../src/renderer/utils/bannerLookup.ts'

const ranksDir = new URL('../src/renderer/assets/banner/rango/', import.meta.url)
const portraitsDir = new URL('../src/renderer/assets/banner/personaje/', import.meta.url)
const backgroundsDir = new URL('../src/renderer/assets/banner/fondo/', import.meta.url)

const rankFiles = readdirSync(ranksDir).map((f) => f.replace(/\.webp$/, '').toLowerCase())
const portraitFiles = readdirSync(portraitsDir).map((f) => f.replace(/\.webp$/, '').toLowerCase())
const backgroundFiles = readdirSync(backgroundsDir).map((f) => f.replace(/\.webp$/, '').toLowerCase())

const map = (names: string[]) => Object.fromEntries(names.map((n) => [n, `url/${n}`]))

test('cada rango declarado tiene su emblema en disco', () => {
  for (const [label, slug] of Object.entries(RANK_ART_SLUGS)) {
    assert.ok(rankFiles.includes(slug), `falta el emblema de "${label}" (${slug}.webp)`)
  }
})

test('cada personaje con arte tiene su retrato en disco', () => {
  for (const [label, slug] of Object.entries(CHARACTER_ART_SLUGS)) {
    assert.ok(portraitFiles.includes(slug), `falta el retrato de "${label}" (${slug}.webp)`)
  }
})

test('no quedan emblemas huérfanos sin rango declarado', () => {
  const declared = new Set(Object.values(RANK_ART_SLUGS))
  const orphans = rankFiles.filter((f) => !declared.has(f))
  assert.deepEqual(orphans, [], `emblemas sin rango: ${orphans.join(', ')}`)
})

test('la escalera de rangos conserva el orden esperado', () => {
  assert.equal(TEKKEN_RANKS[0], 'Beginner')
  assert.equal(TEKKEN_RANKS.at(-1), 'God of Destruction VIII')
  assert.ok(TEKKEN_RANKS.indexOf('Garyu') > TEKKEN_RANKS.indexOf('Eliminator'))
  assert.ok(TEKKEN_RANKS.indexOf('God of Destruction') > TEKKEN_RANKS.indexOf('Tekken God Supreme'))
})

test('rankArtUrl resuelve por etiqueta y devuelve null si no hay arte', () => {
  const ranks = map(rankFiles)
  assert.equal(rankArtUrl(ranks, 'Tekken God'), 'url/tekkengod')
  assert.equal(rankArtUrl(ranks, '1st Dan'), 'url/1stdan')
  assert.equal(rankArtUrl(ranks, 'God of Destruction VII'), 'url/godofdestruction07')
  assert.equal(rankArtUrl(ranks, 'Rango Inventado'), null)
  assert.equal(rankArtUrl(ranks, ''), null)
})

test('portraitUrl resuelve alias de nombre', () => {
  const portraits = map(portraitFiles)
  assert.equal(portraitUrl(portraits, 'Law'), 'url/marshall-law')
  assert.equal(portraitUrl(portraits, 'Heihachi'), 'url/heihachi-mishima')
  assert.equal(portraitUrl(portraits, 'Miary Zo'), 'url/miary-zo')
  assert.equal(portraitUrl(portraits, 'Miary-Zo'), 'url/miary-zo')
  assert.equal(portraitUrl(portraits, 'Jack-8'), 'url/jack-8')
  assert.equal(portraitUrl(portraits, 'Yujiro Hanma'), null)
})

test('portraitUrl cae a coincidencia por sufijo', () => {
  const portraits = { 'marshall-law': 'url/law' }
  assert.equal(portraitUrl(portraits, 'Law'), 'url/law')
})

test('backgroundFor es determinista y siempre devuelve un fondo', () => {
  const options = backgroundFiles.map((f) => `url/${f}`)
  const a = backgroundFor('Heihachi', options)
  const b = backgroundFor('Heihachi', options)
  assert.equal(a, b)
  assert.ok(options.includes(a!))
  assert.equal(backgroundFor('cualquiera', []), null)
})

test('toSlugMap y slugify normalizan rutas y etiquetas', () => {
  assert.deepEqual(toSlugMap({ 'a/b/Tekken-God.webp': 'u1', 'x/y/1stDan.webp': 'u2' }), {
    'tekken-god': 'u1',
    '1stdan': 'u2',
  })
  assert.equal(slugify('1st Dan'), '1stdan')
  assert.equal(slugify('Tekken God Supreme'), 'tekkengodsupreme')
  assert.equal(slugify('God of Destruction ∞'), 'godofdestruction')
})
