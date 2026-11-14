import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import * as DomainServices from './index.ts'

const ExpectedServiceExports = [
  'srgbToLinear',
  'linearToSrgb',
  'hexToRgb',
  'rgbToHex',
  'shortestHueDelta',
  'toneToY',
  'yToTone',
  'rgbToOkyct',
  'hexToOkyct',
  'isInGamut',
  'isInSrgbGamut',
  'findGamutCusp',
  'findMaxChromaForTone',
  'okyctToRgb',
  'okyctToHex',
  'okyctToDisplayP3Css',
  'okyctToOklchCss',
  'simulateCvd',
  'getContrastRatio',
  'solveTonesForApca',
  'solveTonesForContrast',
  'getApcaContrast',
  'getDeltaEOklab',
  'getDeltaE2000',
  'runColorimetricInvariantSuite',
] as const

describe('domain/services barrel', () => {
  it('exports all 25 documented domain service functions', () => {
    for (const name of ExpectedServiceExports) {
      assert.equal(typeof DomainServices[name], 'function', `Expected export ${name} to be a function`)
    }
  })

  it('performs cohesive end-to-end colorimetric operations via barrel exports', () => {
    assert.equal(DomainServices.yToTone(DomainServices.toneToY(40)).toFixed(3), '40.000')
    assert.ok(DomainServices.findGamutCusp(250).chroma > 0)
    assert.ok(DomainServices.getContrastRatio(100, 0) >= 20.9)
    assert.match(DomainServices.okyctToHex(DomainServices.hexToOkyct('#2563EB')), /^#[0-9a-f]{6}$/)
    assert.equal(DomainServices.runColorimetricInvariantSuite().every((r) => r.passed), true)
  })
})
