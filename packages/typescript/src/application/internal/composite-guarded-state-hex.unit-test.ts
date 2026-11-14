import test from 'node:test'
import assert from 'node:assert/strict'
import { getContrastRatio } from '../../domain/index.ts'
import { compositeGuardedStateHex } from './composite-guarded-state-hex.ts'

test('compositeGuardedStateHex preserves WCAG AA contrast when contrastGuard is true', () => {
  const hex = compositeGuardedStateHex('#2563EB', '#FFFFFF', 'pressed', 'okyct', true)
  assert.match(hex, /^#[0-9a-f]{6}$/i)
  assert.ok(getContrastRatio(hex, '#FFFFFF') >= 4.5)
})
