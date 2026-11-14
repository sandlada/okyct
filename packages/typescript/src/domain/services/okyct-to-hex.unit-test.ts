import test from 'node:test'
import assert from 'node:assert/strict'
import { hexToOkyct } from './hex-to-okyct.ts'
import { okyctToHex } from './okyct-to-hex.ts'

test('okyctToHex formats #rrggbb and roundtrips with hexToOkyct', () => {
  for (const hex of ['#000000', '#ffffff', '#2563eb', '#ef4444', '#10b981']) {
    assert.equal(okyctToHex(hexToOkyct(hex)), hex)
  }
})
