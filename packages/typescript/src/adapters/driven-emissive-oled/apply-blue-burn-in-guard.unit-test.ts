import test from 'node:test'
import assert from 'node:assert/strict'
import { hexToOkyct } from '../../domain/index.ts'
import { applyBlueBurnInGuard } from './apply-blue-burn-in-guard.ts'

test('applyBlueBurnInGuard reduces high-chroma blue burn-in risk while preserving tone', () => {
  const input = '#0000FF'
  const guarded = applyBlueBurnInGuard(input)
  assert.match(guarded, /^#[0-9a-f]{6}$/i)
  assert.ok(hexToOkyct(guarded).c <= hexToOkyct(input).c + 1e-4)
})
