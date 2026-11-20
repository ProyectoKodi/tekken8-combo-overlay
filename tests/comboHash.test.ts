import test from 'node:test'
import assert from 'node:assert/strict'
import { comboHash } from '../src/shared/comboHash.ts'

test('el mismo combo produce el mismo hash aunque cambie el formato', () => {
  const a = comboHash({ character: 'Jin', notation: 'd/f,2 ► b,1,4', creator: 'Kage', damage: 55 })
  const b = comboHash({ character: 'jin', notation: 'D/F, 2►B, 1, 4', creator: ' kage ', damage: 55 })
  assert.equal(a, b)
})

test('mayúsculas y espacios del creador no afectan', () => {
  const a = comboHash({ character: 'Reina', notation: 'f,N,d,df+2', creator: 'Player One' })
  const b = comboHash({ character: 'reina', notation: 'f,N,d,df+2', creator: 'player one' })
  assert.equal(a, b)
})

test('combos distintos producen hashes distintos', () => {
  const a = comboHash({ character: 'Jin', notation: 'd/f,2', damage: 55 })
  const b = comboHash({ character: 'Kazuya', notation: 'd/f,2', damage: 55 })
  const c = comboHash({ character: 'Jin', notation: 'd/f,2', damage: 56 })
  assert.notEqual(a, b)
  assert.notEqual(a, c)
})

test('el hash es hexadecimal sin signo y de longitud acotada', () => {
  const h = comboHash({ character: 'King', notation: 'u/f+4', damage: 70 })
  assert.match(h, /^[0-9a-f]{1,8}$/)
})

test('es determinista entre llamadas', () => {
  const combo = { character: 'Lili', notation: 'df+3,2', damage: 42 }
  assert.equal(comboHash(combo), comboHash(combo))
})

test('tolera campos opcionales ausentes', () => {
  assert.doesNotThrow(() => comboHash({ character: 'Panda', notation: 'b+1' }))
})
