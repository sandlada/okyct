import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { ColorToneInput } from '../../models/index.ts'
import { resolveToneInput } from './resolve-tone-input.ts'

describe('resolveToneInput', () => {
  it('resolves numeric tones, OKYCT objects, and 3/6-digit hex strings', () => {
    assert.equal(resolveToneInput(0), 0)
    assert.equal(resolveToneInput(42), 42)
    assert.equal(resolveToneInput(100), 100)
    assert.equal(resolveToneInput({ h: 250, c: 0.1, t: 65 }), 65)
    assert.equal(resolveToneInput('#000'), 0)
    assert.ok(Math.abs(resolveToneInput('#FFFFFF') - 100) < 1e-3)
  })

  it('throws on unsupported types, missing t field, or out-of-range tone values', () => {
    assert.throws(() => resolveToneInput(null as unknown as ColorToneInput), /Invalid tone input/)
    assert.throws(() => resolveToneInput({ h: 200 } as unknown as ColorToneInput), /Invalid tone input/)
    assert.throws(() => resolveToneInput(-1), /Invalid tone value/)
    assert.throws(() => resolveToneInput(101), /Invalid tone value/)
    assert.throws(() => resolveToneInput(Number.NaN), /Invalid tone value/)
    assert.throws(() => resolveToneInput('bad-hex'), /Invalid hex/)
  })
})
