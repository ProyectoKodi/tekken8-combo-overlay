import test from 'node:test'
import assert from 'node:assert/strict'
import { parseNotation } from '../src/renderer/utils/notationParser.ts'

test('las direcciones y botones se convierten en imágenes', () => {
  const tokens = parseNotation('d/f,2')
  assert.equal(tokens.length, 2)
  const [dir, button] = tokens
  assert.equal(dir.type, 'image')
  assert.ok(dir.type === 'image' && dir.src.endsWith('/df.svg'))
  assert.ok(button.type === 'image' && button.src.endsWith('/2.svg'))
})

test('los ► generan separadores', () => {
  const tokens = parseNotation('d/f,2 ► b,1,4')
  assert.equal(tokens.filter((t) => t.type === 'separator').length, 1)
})

test('W! se marca como badge de pared', () => {
  const tokens = parseNotation('W!')
  assert.equal(tokens.length, 1)
  assert.ok(tokens[0].type === 'badge' && tokens[0].color === 'wall')
})

test('los just-frames insertan el icono jf', () => {
  const tokens = parseNotation(':2')
  assert.ok(tokens.some((t) => t.type === 'image' && t.src.endsWith('/jf.svg')))
})

test('los holds de dirección usan el icono de hold', () => {
  const tokens = parseNotation('F')
  assert.ok(tokens.some((t) => t.type === 'image' && t.src.endsWith('/fh.svg')))
})

test('fusiona nombres de stance de varias palabras', () => {
  const tokens = parseNotation('Jin, Ji, Du, Li')
  assert.equal(tokens.length, 1)
  assert.ok(tokens[0].type === 'badge' && tokens[0].value === 'Jin Ji Du Li')
})

test('el texto desconocido queda como badge de personaje', () => {
  const tokens = parseNotation('Foo Bar')
  assert.equal(tokens.length, 1)
  assert.ok(tokens[0].type === 'badge' && tokens[0].color === 'char')
})

test('notación vacía o en blanco no produce tokens', () => {
  assert.deepEqual(parseNotation(''), [])
  assert.deepEqual(parseNotation('   '), [])
})
