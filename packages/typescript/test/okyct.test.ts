import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TonalPalette,
  auditSchemeContrast,
  buildDynamicScheme,
  computeColorEmissiveTelemetry,
  createPalettesFromSource,
  createTheme,
  findGamutCusp,
  findMaxChromaForTone,
  getApcaContrast,
  getContrastRatio,
  harmonizeHex,
  hexToOkyct,
  isInGamut,
  okyctToDisplayP3Css,
  okyctToHex,
  okyctToRgb,
  resolveCustomColors,
  rgbToOkyct,
  runColorimetricInvariantSuite,
  shortestHueDelta,
  solveTonesForApca,
  solveTonesForContrast,
  stackLayers,
  verifyHexagonalArchitectureBoundaries,
  EmissivePanelTypes,
  StandardTones,
  ThemeModes,
} from '../src/index.ts'
import { applyBlueBurnInGuard } from '../src/adapters/driven-emissive-oled/index.ts'

test('hexagonal architecture boundaries verify cleanly', () => {
  const result = verifyHexagonalArchitectureBoundaries()
  assert.equal(result.passed, true)
})

test('built-in colorimetric invariant suite passes with zero violations', () => {
  const results = runColorimetricInvariantSuite()
  for (const item of results) {
    assert.equal(item.passed, true, `${item.id} failed: ${item.measuredValue}`)
  }
})

test('TonalPalette minimizes Tone & Hue drift across diverse seeds and supports fractional tones', () => {
  const seeds = ['#2563EB', '#FFD600', '#FF0000', '#00A859', '#7C3AED', '#FF00FF']
  for (const seed of seeds) {
    const palette = TonalPalette.fromHex(seed)
    for (const stop of StandardTones) {
      const hex = palette.tone(stop)
      const measured = hexToOkyct(hex)
      assert.ok(
        Math.abs(measured.t - stop) <= 0.35,
        `Tone drift too large for ${seed} T${stop}: measured=${measured.t}`
      )
      if (measured.c > 0.03) {
        const hDrift = shortestHueDelta(measured.h, palette.hue)
        assert.ok(hDrift <= 0.5, `Hue drift too large for ${seed} T${stop}: ${hDrift}°`)
      } else if (measured.c > 0.015) {
        const hDrift = shortestHueDelta(measured.h, palette.hue)
        const arc = measured.c * ((hDrift * Math.PI) / 180)
        assert.ok(arc <= 0.001, `Low-chroma hue arc too large for ${seed} T${stop}: arc=${arc}`)
      }
    }
  }

  const p = TonalPalette.fromHex('#2563EB')
  const t45 = hexToOkyct(p.tone(4.5)).t
  const t50 = hexToOkyct(p.tone(5.0)).t
  assert.ok(t45 < t50, `Expected fractional tone(4.5) < tone(5.0), got ${t45} vs ${t50}`)
  assert.ok(Math.abs(t45 - 4.5) <= 0.35)
})

test('seed chroma de-attenuation lifts extreme-tone chromatic seeds while leaving neutral gray neutral', () => {
  const sky = TonalPalette.fromHex('#BAE6FD')
  assert.ok(sky.targetChroma > hexToOkyct('#BAE6FD').c)

  const gray = TonalPalette.fromHex('#808080')
  assert.ok(gray.targetChroma < 0.005)
  assert.ok(hexToOkyct(gray.tone(50)).c < 0.005)
})

test('opt-in H-K compensation leaves default TonalPalette with zero extra Tone drift', () => {
  const defaultPalette = TonalPalette.fromHex('#2563EB')
  const hkPalette = TonalPalette.fromHex('#2563EB', { hkCompensation: true })
  const tDefault = hexToOkyct(defaultPalette.tone(50)).t
  const tHk = hexToOkyct(hkPalette.tone(50)).t

  assert.ok(Math.abs(tDefault - 50) <= 0.35)
  assert.ok(tHk < tDefault - 1.0, `Expected H-K compensated T50 (${tHk}) < default T50 (${tDefault})`)
})

test('cusp-compress preserves chroma better than preserve-tone with zero hue drift, and P3 >= sRGB', () => {
  const outOfGamutYellow = { h: 109, c: 0.25, t: 60 }
  const preserveRgb = okyctToRgb(outOfGamutYellow, { gamutMapping: 'preserve-tone' })
  const compressRgb = okyctToRgb(outOfGamutYellow, { gamutMapping: 'cusp-compress' })

  const preserveOky = rgbToOkyct(preserveRgb)
  const compressOky = rgbToOkyct(compressRgb)

  assert.ok(Math.abs(preserveOky.t - 60) < 0.05)
  assert.ok(compressOky.c > preserveOky.c)
  assert.ok(shortestHueDelta(compressOky.h, 109) < 0.05)

  for (let h = 0; h < 360; h += 30) {
    const cuspSrgb = findGamutCusp(h, { gamut: 'srgb' })
    const cuspP3 = findGamutCusp(h, { gamut: 'display-p3' })
    assert.ok(cuspP3.chroma >= cuspSrgb.chroma - 1e-4)
    assert.ok(
      findMaxChromaForTone(h, 55, { gamut: 'display-p3' }) >=
        findMaxChromaForTone(h, 55, { gamut: 'srgb' }) - 1e-4
    )
  }

  assert.equal(isInGamut({ h: 255, c: 0.12, t: 50 }, { gamut: 'srgb' }).inGamut, true)
  assert.match(okyctToDisplayP3Css({ h: 140, c: 0.3, t: 75 }, { gamutMapping: 'cusp-compress' }), /^color\(display-p3 /)
})

test('dynamic schemes achieve 100% WCAG 2.1 and APCA compliance across extreme seeds, panels, and contrast levels', () => {
  const seeds = ['#FFD600', '#2563EB', '#FF0000', '#00FF00', '#FF00FF', '#000000', '#FFFFFF', '#14B8A6']
  const contrasts = [-1.0, 0.0, 0.5, 1.0]

  for (const seed of seeds) {
    const palettes = createPalettesFromSource(seed)
    for (const profile of EmissivePanelTypes) {
      for (const mode of ThemeModes) {
        for (const contrastLevel of contrasts) {
          for (const physicsToggle of [false, true]) {
            const scheme = buildDynamicScheme(palettes, {
              mode,
              contrastLevel,
              contrastMetric: 'both',
              emissive: {
                profile,
                burnInGuard: physicsToggle,
                antiFringing: physicsToggle,
              },
            })
            const audit = auditSchemeContrast(scheme)
            for (const item of audit) {
              assert.equal(
                item.wcagPassAA,
                true,
                `WCAG fail for seed=${seed} profile=${profile} mode=${mode} c=${contrastLevel} physics=${physicsToggle} pair=${item.fgRole}/${item.bgRole}: ratio=${item.wcagRatio}`
              )
              assert.equal(
                item.apcaPass,
                true,
                `APCA fail for seed=${seed} profile=${profile} mode=${mode} c=${contrastLevel} physics=${physicsToggle} pair=${item.fgRole}/${item.bgRole}: lc=${item.apcaLc}`
              )
            }
          }
        }
      }
    }
  }
})

test('createTheme and resolveCustomColors enforce WCAG + APCA contrast cleanly', () => {
  const theme = createTheme({
    sourceHex: '#FFD600',
    variant: 'vibrant',
    contrastLevel: 0.5,
    emissive: { profile: 'micro-oled-xr', burnInGuard: true, antiFringing: true },
    customColors: [{ name: 'brandAccent', sourceHex: '#3B82F6' }],
  })
  for (const mode of ThemeModes) {
    for (const item of theme.auditContrast(mode)) {
      assert.equal(item.wcagPassAA, true)
      assert.equal(item.apcaPass, true)
    }
  }

  const custom = resolveCustomColors(
    [
      { name: 'sun', sourceHex: '#FFD600' },
      { name: 'cobalt', sourceHex: '#0000FF' },
    ],
    '#2563EB',
    { mode: 'dark', contrastLevel: 0.4, contrastMetric: 'both' }
  )
  for (const item of custom) {
    assert.ok(item.wcagRatioColor >= 4.5)
    assert.ok(item.wcagRatioContainer >= 4.5)
    assert.ok(item.apcaLcColor >= 65)
    assert.ok(item.apcaLcContainer >= 65)
  }
})

test('stackLayers neutralizes complements in OKLab mode and harmonizeHex ignores neutral gray seeds', () => {
  const equalComplementA = okyctToHex({ h: 30, c: 0.08, t: 60 })
  const equalComplementB = okyctToHex({ h: 210, c: 0.08, t: 60 })
  const exactComp = stackLayers({ blendSpace: 'okyct' })([{ color: equalComplementB, opacity: 0.5 }])(
    equalComplementA
  )
  assert.ok(
    exactComp.finalOkyct.c < 0.005,
    `Expected equal-chroma OKLab complements to neutralize, got chroma=${exactComp.finalOkyct.c}`
  )

  const comp = stackLayers({ blendSpace: 'okyct' })([{ color: '#00FFFF', opacity: 0.5 }])('#FF0000')
  assert.ok(
    comp.finalOkyct.c < 0.08,
    `Expected asymmetric complementary vector blend to attenuate chroma, got chroma=${comp.finalOkyct.c}`
  )

  const harmonizedByGray = harmonizeHex('#BA1A1A', '#808080', 18)
  assert.equal(harmonizedByGray.toUpperCase(), '#BA1A1A')
})

test('applyBlueBurnInGuard is continuous across 265° and telemetry APL uses physical linear luminance', () => {
  const leftHex = okyctToHex({ h: 264, c: 0.16, t: 55 })
  const rightHex = okyctToHex({ h: 266, c: 0.16, t: 55 })
  const guardedLeft = hexToOkyct(applyBlueBurnInGuard(leftHex))
  const guardedRight = hexToOkyct(applyBlueBurnInGuard(rightHex))

  assert.ok(
    shortestHueDelta(guardedLeft.h, guardedRight.h) < 3.5,
    `Discontinuity at 265°: left=${guardedLeft.h}, right=${guardedRight.h}`
  )

  const midGray = computeColorEmissiveTelemetry('#808080')
  assert.ok(midGray.aplPercent > 20 && midGray.aplPercent < 24, `Expected physical ~21.6% APL, got ${midGray.aplPercent}`)
  assert.equal(computeColorEmissiveTelemetry('#000000').isPixelOff, true)
  assert.equal(computeColorEmissiveTelemetry('#FFFFFF').aplPercent, 100)
})

test('solveTonesForApca and solveTonesForContrast satisfy target bounds across [0, 100]', () => {
  for (let bg = 0; bg <= 100; bg += 2) {
    const apca = solveTonesForApca(bg, 60)
    if (apca.darkForegroundTone !== null) {
      assert.ok(Math.abs(getApcaContrast(apca.darkForegroundTone, bg)) >= 60)
    }
    if (apca.lightForegroundTone !== null) {
      assert.ok(Math.abs(getApcaContrast(apca.lightForegroundTone, bg)) >= 60)
    }

    const both = solveTonesForContrast(bg, 4.5, { metric: 'both', targetLc: 60 })
    if (both.darkForegroundTone !== null) {
      assert.ok(getContrastRatio(both.darkForegroundTone, bg) >= 4.5)
      assert.ok(Math.abs(getApcaContrast(both.darkForegroundTone, bg)) >= 60)
    }
    if (both.lightForegroundTone !== null) {
      assert.ok(getContrastRatio(both.lightForegroundTone, bg) >= 4.5)
      assert.ok(Math.abs(getApcaContrast(both.lightForegroundTone, bg)) >= 60)
    }
  }
})
