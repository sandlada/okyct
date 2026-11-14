import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { simulateCvd } from './simulate-cvd.ts'
import type { CvdType } from '../models/index.ts'

describe('simulateCvd', () => {
  it('returns the input hex unchanged when type is none or severity is 0', () => {
    assert.equal(simulateCvd('#2563EB', 'none'), '#2563EB')
    assert.equal(simulateCvd('#EF4444', 'protanopia', 0), '#EF4444')
    assert.equal(simulateCvd('#EF4444', 'protanopia', -0.5), '#EF4444')
  })

  it('simulates protanopia, deuteranopia, tritanopia, and achromatopsia into valid hex', () => {
    const protan = simulateCvd('#EF4444', 'protanopia', 1)
    const deutan = simulateCvd('#10B981', 'deuteranopia', 1)
    const tritan = simulateCvd('#2563EB', 'tritanopia', 1)
    const achrom = simulateCvd('#EF4444', 'achromatopsia', 1)

    for (const hex of [protan, deutan, tritan, achrom]) {
      assert.match(hex, /^#[0-9a-f]{6}$/)
    }

    assert.equal(achrom.slice(1, 3), achrom.slice(3, 5))
    assert.equal(achrom.slice(3, 5), achrom.slice(5, 7))
  })

  it('interpolates linearly with severity and clamps severity above 1', () => {
    const half = simulateCvd('#EF4444', 'protanopia', 0.5)
    const full = simulateCvd('#EF4444', 'protanopia', 1)
    const overClamped = simulateCvd('#EF4444', 'protanopia', 2.5)
    assert.notEqual(half, '#ef4444')
    assert.notEqual(half, full)
    assert.equal(overClamped, full)
  })

  it('keeps neutral gray scale stable under all CVD matrices', () => {
    for (const kind of ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as const) {
      assert.equal(simulateCvd('#000000', kind), '#000000')
      assert.equal(simulateCvd('#ffffff', kind), '#ffffff')
    }
  })

  it('throws on invalid CVD types, non-finite severity, or malformed hex', () => {
    assert.throws(() => simulateCvd('#2563EB', 'monochromacy' as CvdType), /Invalid CVD type/)
    assert.throws(() => simulateCvd('#2563EB', 'protanopia', Number.NaN), /Invalid CVD severity/)
    assert.throws(() => simulateCvd('#2563EB', 'protanopia', Number.POSITIVE_INFINITY), /Invalid CVD severity/)
    assert.throws(() => simulateCvd('bad-hex', 'protanopia'), /Invalid hex/)
  })
})
