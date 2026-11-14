import test from 'node:test'
import assert from 'node:assert/strict'
import { stackToCssColorMix } from './stack-to-css-color-mix.ts'

test('stackToCssColorMix emits valid CSS color-mix expression', () => {
  const css = stackToCssColorMix({ space: 'oklch' })([{ color: '#FFFFFF', opacity: 0.08 }])('#2563EB')
  assert.match(css, /^color-mix\(in oklch,/)
})
