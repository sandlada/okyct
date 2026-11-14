import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildLandingPalette,
  buildPanelSwatches,
  buildSpectrumStops,
  buildTerrainRoleRamps,
} from './palette.ts'

describe('landing/palette', () => {
  it('builds palettes, spectrum stops, panel swatches, and terrain ramps', () => {
    const palette = buildLandingPalette('#1A73E8')
    assert.ok(palette.rows.length > 0)
    const stops = buildSpectrumStops('#1A73E8')
    assert.ok(stops.length > 0)
    const swatches = buildPanelSwatches('#1A73E8')
    assert.ok(swatches.length > 0)
    const roles = buildTerrainRoleRamps('#1A73E8', false)
    assert.equal(typeof roles, 'object')
    assert.ok(roles !== null)
    assert.ok(Object.keys(roles).length > 0)
  })
})
