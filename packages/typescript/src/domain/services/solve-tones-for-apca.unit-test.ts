import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getApcaContrast } from './get-apca-contrast.ts'
import { solveTonesForApca } from './solve-tones-for-apca.ts'

describe('solveTonesForApca', () => {
  it('handles targetLc=0 fast path cleanly', () => {
    const sol = solveTonesForApca(52.4, 0)
    assert.deepEqual(sol, { darkForegroundTone: 52, lightForegroundTone: 53 })
  })

  it('solves dark foreground tones for light backgrounds and light foreground tones for dark backgrounds', () => {
    const solLightBg = solveTonesForApca(95, 60)
    assert.ok(solLightBg.darkForegroundTone !== null)
    assert.equal(solLightBg.lightForegroundTone, null)
    assert.ok(getApcaContrast(solLightBg.darkForegroundTone, 95) >= 60)

    const solDarkBg = solveTonesForApca(10, 60)
    assert.equal(solDarkBg.darkForegroundTone, null)
    assert.ok(solDarkBg.lightForegroundTone !== null)
    assert.ok(Math.abs(getApcaContrast(solDarkBg.lightForegroundTone, 10)) >= 60)
  })

  it('satisfies APCA boundary achievability and soundness/completeness across [0, 100]', () => {
    assert.deepEqual(solveTonesForApca(0, 108), { darkForegroundTone: null, lightForegroundTone: 100 })
    assert.deepEqual(solveTonesForApca(100, 106), { darkForegroundTone: 0, lightForegroundTone: null })

    for (let bgTone = 0; bgTone <= 100; bgTone += 5) {
      for (const targetLc of [45, 60, 75, 90]) {
        const sol = solveTonesForApca(bgTone, targetLc)
        const darkAchievable = Math.abs(getApcaContrast(0, bgTone)) >= targetLc
        const lightAchievable = Math.abs(getApcaContrast(100, bgTone)) >= targetLc

        assert.equal(sol.darkForegroundTone !== null, darkAchievable)
        assert.equal(sol.lightForegroundTone !== null, lightAchievable)

        if (sol.darkForegroundTone !== null) {
          assert.ok(Math.abs(getApcaContrast(sol.darkForegroundTone, bgTone)) >= targetLc)
        }
        if (sol.lightForegroundTone !== null) {
          assert.ok(Math.abs(getApcaContrast(sol.lightForegroundTone, bgTone)) >= targetLc)
        }
      }
    }
  })

  it('supports dual-sided solutions on mid backgrounds and soft black clamp inversion', () => {
    const midLowLc = solveTonesForApca(55, 15)
    assert.ok(midLowLc.darkForegroundTone !== null)
    assert.ok(midLowLc.lightForegroundTone !== null)
    assert.ok(Math.abs(getApcaContrast(midLowLc.darkForegroundTone, 55)) >= 15)
    assert.ok(Math.abs(getApcaContrast(midLowLc.lightForegroundTone, 55)) >= 15)

    const deepInvert = solveTonesForApca(60, 42)
    assert.ok(deepInvert.darkForegroundTone !== null)
    assert.ok(getApcaContrast(deepInvert.darkForegroundTone, 60) >= 42)

    const unreachable = solveTonesForApca(50, 45)
    assert.equal(unreachable.darkForegroundTone, null)
  })

  it('accepts Hex string and OKYCT object background inputs consistently', () => {
    assert.deepEqual(solveTonesForApca('#FFFFFF', 75), solveTonesForApca(100, 75))
    assert.deepEqual(solveTonesForApca({ h: 250, c: 0.12, t: 20 }, 60), solveTonesForApca(20, 60))
  })

  it('throws on invalid targetLc or invalid background inputs', () => {
    assert.throws(() => solveTonesForApca(50, -1), /Invalid targetLc/)
    assert.throws(() => solveTonesForApca(50, 109), /Invalid targetLc/)
    assert.throws(() => solveTonesForApca(50, Number.NaN), /Invalid targetLc/)
    assert.throws(() => solveTonesForApca(-5, 60), /Invalid tone value/)
  })
})
