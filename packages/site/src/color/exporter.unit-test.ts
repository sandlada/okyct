import test from 'node:test'
import assert from 'node:assert/strict'
import { TokenExportFormats, exportCssVariables } from './exporter.ts'

test('color/exporter facade re-exports theme exporters', () => {
  assert.deepEqual(TokenExportFormats, ['css', 'tailwind', 'w3c', 'ts'])
  assert.equal(typeof exportCssVariables, 'function')
})
