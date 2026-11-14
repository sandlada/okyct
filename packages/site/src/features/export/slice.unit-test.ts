import test from 'node:test'
import assert from 'node:assert/strict'
import { ExportFormats, exportReducer, setExportFormat } from './slice.ts'

test('exportReducer updates export format cleanly', () => {
  assert.deepEqual(ExportFormats, ['css', 'tailwind', 'w3c', 'ts'])
  const s0 = exportReducer(undefined, { type: '@@INIT' })
  const s1 = exportReducer(s0, setExportFormat('tailwind'))
  assert.equal(s1.format, 'tailwind')
})
