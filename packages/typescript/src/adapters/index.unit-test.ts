import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDynamicScheme,
  createTheme,
  exportCssVariables,
  extractSeedsFromImageData,
  toTokenDictionary,
} from './index.ts'

test('adapters barrel exports theme, emissive, exporter, quantizer, and fp APIs', () => {
  const theme = createTheme('#2563EB')
  assert.ok(theme.schemes.light.primary)
  const scheme = buildDynamicScheme('#2563EB', { variant: 'tonalSpot', mode: 'light' })
  assert.ok(scheme.primary)
  assert.equal(typeof exportCssVariables, 'function')
  assert.equal(typeof extractSeedsFromImageData, 'function')
  assert.ok(toTokenDictionary(scheme).primary)
})
