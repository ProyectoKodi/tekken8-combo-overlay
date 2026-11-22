import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseCombosFromHtml, extractNextPageUrl } from '../src/main/scraper.ts'

const fixture = new URL('./fixtures/combo-page.html', import.meta.url)
const html = readFileSync(fixture, 'utf-8')

test('parseCombosFromHtml descarta entradas sin notación y parsea las válidas', () => {
  const combos = parseCombosFromHtml(html, 'Kazuya Mishima')
  assert.equal(combos.length, 2)
})

test('extrae notación, daño, hits, versión y autor del primer combo', () => {
  const [combo] = parseCombosFromHtml(html, 'Kazuya Mishima')
  assert.equal(combo.notation, 'd/f+2 ► f,N,d,d/f+2 ► f+4')
  assert.equal(combo.damage, 72)
  assert.equal(combo.hits, 8)
  assert.equal(combo.version, 'v1.05')
  assert.equal(combo.creator, 'KodiProyecto')
  assert.equal(combo.notes, 'Funciona mejor con pared')
  assert.equal(combo.source, 'https://youtu.be/dQw4w9WgXcQ')
})

test('clasifica badges de color como tags', () => {
  const [combo] = parseCombosFromHtml(html, 'Kazuya Mishima')
  assert.ok(combo.tags.includes('Heat'))
  assert.ok(combo.tags.includes('Wall'))
  assert.ok(combo.tags.includes('Stage: Stage 5'))
})

test('el id es estable por contenido, no por posición', () => {
  const [a, b] = parseCombosFromHtml(html, 'Kazuya Mishima')
  assert.notEqual(a.id, b.id)
  assert.match(a.id, /^kazuya-mishima-[0-9a-f]+$/)
})

test('un combo sin notación no produce id y se omite', () => {
  const combos = parseCombosFromHtml(html, 'Kazuya Mishima')
  for (const c of combos) assert.ok(c.notation.length >= 3)
})

test('extractNextPageUrl encuentra la página siguiente desde la primera', () => {
  const next = extractNextPageUrl(html, 'https://tekken8combo.kagewebsite.com/combos-kazuya-mishima/')
  assert.equal(next, 'https://tekken8combo.kagewebsite.com/combos-kazuya-mishima/page=2')
})

test('extractNextPageUrl solo avanza una página', () => {
  const current = 'https://tekken8combo.kagewebsite.com/combos-kazuya-mishima/page=2'
  const html2 = html.replace('page=2', 'page=3')
  const next = extractNextPageUrl(html2, current)
  assert.equal(next, 'https://tekken8combo.kagewebsite.com/combos-kazuya-mishima/page=3')
})

test('extractNextPageUrl devuelve null si no hay paginación', () => {
  const withoutPagination = html.replace(/<div class="pagination">[\s\S]*?<\/div>/, '')
  const next = extractNextPageUrl(withoutPagination, 'https://tekken8combo.kagewebsite.com/combos-kazuya-mishima/')
  assert.equal(next, null)
})
