import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getApcaContrast } from './get-apca-contrast.ts'
import { getContrastRatio } from './get-contrast-ratio.ts'
import { solveTonesForContrast } from './solve-tones-for-contrast.ts'
import type { ContrastMetric } from '../models/index.ts'

describe('solveTonesForContrast', () => {
  it('solves WCAG 2.1 threshold tones with soundness and completeness across AA Large, AA, AAA, and 21:1 bounds', () => {
    for (let bgTone = 0; bgTone <= 100; bgTone += 5) {
      for (const ratio of [3.0, 4.5, 7.0, 21.0]) {
        const sol = solveTonesForContrast(bgTone, ratio)
        const darkAchievable = getContrastRatio(0, bgTone) >= ratio
        const lightAchievable = getContrastRatio(100, bgTone) >= ratio

        assert.equal(sol.darkForegroundTone !== null, darkAchievable)
        assert.equal(sol.lightForegroundTone !== null, lightAchievable)

        if (sol.darkForegroundTone !== null) {
          assert.ok(getContrastRatio(sol.darkForegroundTone, bgTone) >= ratio)
        }
        if (sol.lightForegroundTone !== null) {
          assert.ok(getContrastRatio(sol.lightForegroundTone, bgTone) >= ratio)
        }
      }
    }

    assert.deepEqual(solveTonesForContrast(0, 21), { darkForegroundTone: null, lightForegroundTone: 100 })
    assert.deepEqual(solveTonesForContrast(100, 21), { darkForegroundTone: 0, lightForegroundTone: null })

    const unreachable = solveTonesForContrast(50, 21)
    assert.deepEqual(unreachable, { darkForegroundTone: null, lightForegroundTone: null })

    const ratioOne = solveTonesForContrast(50, 1)
    assert.ok(ratioOne.darkForegroundTone !== null)
    assert.ok(ratioOne.lightForegroundTone !== null)
  })

  it('supports apca and combined wcag+apca (both) metrics', () => {
    const apcaSol = solveTonesForContrast(90, 4.5, { metric: 'apca' })
    assert.ok(apcaSol.darkForegroundTone !== null)
    assert.ok(Math.abs(getApcaContrast(apcaSol.darkForegroundTone, 90)) >= 60)

    const bothSol = solveTonesForContrast(90, 7.0, { metric: 'both', targetLc: 80 })
    assert.ok(bothSol.darkForegroundTone !== null)
    assert.ok(getContrastRatio(bothSol.darkForegroundTone, 90) >= 7.0)
    assert.ok(Math.abs(getApcaContrast(bothSol.darkForegroundTone, 90)) >= 80)

    const customLow = solveTonesForContrast('#111827', 3.0, { metric: 'both' })
    assert.ok(customLow.lightForegroundTone !== null)
    assert.ok(getContrastRatio(customLow.lightForegroundTone, '#111827') >= 3.0)
    assert.ok(Math.abs(getApcaContrast(customLow.lightForegroundTone, '#111827')) >= 45)
  })

  it('throws on invalid targetRatio, invalid metric, or invalid background input', () => {
    assert.throws(() => solveTonesForContrast(50, 0.9), /Invalid targetRatio/)
    assert.throws(() => solveTonesForContrast(50, 21.1), /Invalid targetRatio/)
    assert.throws(() => solveTonesForContrast(50, Number.NaN), /Invalid targetRatio/)
    assert.throws(
      () => solveTonesForContrast(50, 4.5, { metric: 'wcag3' as ContrastMetric }),
      /Invalid contrast metric/,
    )
    assert.throws(() => solveTonesForContrast(120, 4.5), /Invalid tone value/)
  })
})
