import test from 'node:test'
import assert from 'node:assert/strict'
import { createTheme } from '../../create-theme.ts'
import {
  resolveCustomStateLayersForExport,
  resolveSystemStateLayersForExport,
  toStateLayerRecord,
} from './resolve-export-state-layers.ts'

test('resolve-export-state-layers resolves system and custom state layers for export', () => {
  const theme = createTheme({
    sourceHex: '#2563EB',
    customColors: [{ name: 'success', sourceHex: '#10B981' }],
  })
  const sys = resolveSystemStateLayersForExport(theme.schemes.light, ['hovered'])
  assert.ok(sys.length > 0)
  const custom = resolveCustomStateLayersForExport(theme.customColors.light[0], ['hovered'])
  assert.ok(custom.colorStates.length > 0)
  const rec = toStateLayerRecord(theme.schemes.light, ['hovered'])
  assert.ok(rec.primaryHovered)
})
