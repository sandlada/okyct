import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TonalPalette,
  analyzeEmissiveSchemeMetrics,
  auditSchemeContrast,
  auditSchemeCvd,
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
  okyctToOklchCss,
  okyctToRgb,
  resolveCustomColors,
  rgbToOkyct,
  runColorimetricInvariantSuite,
  shortestHueDelta,
  simulateCvd,
  solveTonesForApca,
  solveTonesForContrast,
  stackLayers,
  stackStateLayers,
  verifyHexagonalArchitectureBoundaries,
  EmissivePanelTypes,
  StandardTones,
  StateLayerStates,
  StatefulSystemColorTokens,
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

test('stateLayers are disabled by default and generated on demand for background tokens only', () => {
  const defaultScheme = buildDynamicScheme('#2563EB', { mode: 'dark' })
  assert.equal(defaultScheme.stateLayers, undefined)
  assert.equal(defaultScheme.primaryHovered, undefined)

  const defaultTheme = createTheme({
    sourceHex: '#2563EB',
    customColors: [{ name: 'brandAccent', sourceHex: '#10B981' }],
  })
  assert.equal(defaultTheme.schemes.dark.stateLayers, undefined)
  assert.equal(defaultTheme.customColors.dark[0].stateLayers, undefined)
  assert.equal(defaultTheme.tokens('dark').primaryHovered, undefined)
  assert.equal(defaultTheme.export('css').includes('--md-sys-color-primary-hovered'), false)
  assert.equal(defaultTheme.export('tailwind').includes('--color-primary-hovered'), false)

  const fullTheme = createTheme({
    sourceHex: '#2563EB',
    stateLayers: true,
    customColors: [{ name: 'brandAccent', sourceHex: '#10B981' }],
  })
  const dark = fullTheme.schemes.dark
  assert.ok(dark.stateLayers)
  assert.equal(
    Object.keys(dark.stateLayers).length,
    StatefulSystemColorTokens.length * StateLayerStates.length
  )

  const expectedPrimaryHovered = stackStateLayers(['hovered'])({
    base: dark.primary,
    stateColor: dark.onPrimary,
  }).finalHex
  assert.equal(dark.primaryHovered, expectedPrimaryHovered)
  assert.equal(dark.stateLayers.primaryHovered, expectedPrimaryHovered)

  const expectedOnPrimaryHovered = stackStateLayers(['hovered'])({
    base: dark.onPrimary,
    stateColor: dark.primary,
  }).finalHex
  assert.equal(dark.onPrimaryHovered, expectedOnPrimaryHovered)
  assert.equal(dark.stateLayers.onPrimaryHovered, expectedOnPrimaryHovered)

  const expectedFixedDimHovered = stackStateLayers(['hovered'])({
    base: dark.primaryFixedDim,
    stateColor: dark.onPrimaryFixed,
  }).finalHex
  assert.equal(dark.primaryFixedDimHovered, expectedFixedDimHovered)

  assert.equal((dark as Record<string, unknown>).outlineHovered, undefined)
  assert.equal((dark as Record<string, unknown>).scrimHovered, undefined)

  const custom = fullTheme.customColors.dark[0]
  assert.ok(custom.stateLayers)
  assert.equal(Object.keys(custom.stateLayers).length, 16)
  assert.equal(
    custom.stateLayers.colorHovered,
    stackStateLayers(['hovered'])({ base: custom.color, stateColor: custom.onColor }).finalHex
  )
  assert.equal(
    custom.stateLayers.onColorHovered,
    stackStateLayers(['hovered'])({ base: custom.onColor, stateColor: custom.color }).finalHex
  )
  assert.equal(
    custom.stateLayers.colorContainerPressed,
    stackStateLayers(['pressed'])({
      base: custom.colorContainer,
      stateColor: custom.onColorContainer,
    }).finalHex
  )
  assert.equal(
    custom.stateLayers.onColorContainerPressed,
    stackStateLayers(['pressed'])({
      base: custom.onColorContainer,
      stateColor: custom.colorContainer,
    }).finalHex
  )

  const tokensDict = fullTheme.tokens('dark')
  assert.equal(tokensDict.primaryHovered, expectedPrimaryHovered)
  assert.equal(tokensDict.onPrimaryHovered, expectedOnPrimaryHovered)
  assert.equal(tokensDict.brandAccentHovered, custom.stateLayers.colorHovered)
  assert.equal(tokensDict.onBrandAccentHovered, custom.stateLayers.onColorHovered)
  assert.equal(tokensDict.brandAccentContainerPressed, custom.stateLayers.colorContainerPressed)
  assert.equal(tokensDict.onBrandAccentContainerPressed, custom.stateLayers.onColorContainerPressed)

  const subsetScheme = buildDynamicScheme('#2563EB', {
    mode: 'light',
    stateLayers: ['hovered', 'pressed'],
  })
  assert.ok(subsetScheme.primaryHovered)
  assert.ok(subsetScheme.primaryPressed)
  assert.equal(subsetScheme.primaryFocused, undefined)
  assert.equal(subsetScheme.primaryDragged, undefined)

  const cssOut = defaultTheme.export('css', { stateLayers: ['hovered'] })
  assert.ok(cssOut.includes('--md-sys-color-primary-hovered:'))
  assert.ok(cssOut.includes('--md-custom-color-brand-accent-hovered:'))
  assert.ok(cssOut.includes('--md-custom-color-brand-accent-container-hovered:'))
  assert.equal(cssOut.includes('--md-sys-color-primary-focused:'), false)

  const twOut = defaultTheme.export('tailwind', { stateLayers: ['hovered'] })
  assert.ok(twOut.includes('--color-primary-hovered: var(--md-sys-color-primary-hovered,'))
  assert.ok(twOut.includes('--color-brand-accent-hovered: var(--md-custom-color-brand-accent-hovered,'))

  const w3cOut = JSON.parse(defaultTheme.export('w3c', { stateLayers: ['hovered'] }))
  assert.ok(w3cOut.color.dark.primaryHovered.$value)
  assert.ok(w3cOut.color.dark.brandAccent.colorHovered.$value)

  const tsOut = defaultTheme.export('ts', { stateLayers: ['hovered'] })
  assert.ok(tsOut.includes('"primaryHovered":'))
  assert.ok(tsOut.includes('"colorHovered":'))
})

test('ADR-001/002/003/005/006: oklch CSS, ABL guard, WOLED, linear CVD, ambient surround, and guarded state layers', () => {
  // ADR-001 Option C: oklch() floating-point output
  const oklchCss = okyctToOklchCss({ h: 261.6, c: 0.14, t: 50 })
  assert.match(oklchCss, /^oklch\(\d+\.\d+% 0\.1400 261\.60\)$/)

  // ADR-002 Option A: ablGuard caps light-mode APL <= 65% while preserving WCAG AA
  const lightStandard = buildDynamicScheme('#2563EB', {
    mode: 'light',
    emissive: { profile: 'oled-true-black', ablGuard: false },
  })
  const lightAblGuarded = buildDynamicScheme('#2563EB', {
    mode: 'light',
    emissive: { profile: 'oled-true-black', ablGuard: true },
  })
  const stdMetrics = analyzeEmissiveSchemeMetrics(lightStandard, 'oled-true-black')
  const ablMetrics = analyzeEmissiveSchemeMetrics(lightAblGuarded, 'oled-true-black')
  assert.ok(stdMetrics.aplPercent > 65)
  assert.ok(ablMetrics.aplPercent <= 65, `Expected APL <= 65, got ${ablMetrics.aplPercent}`)
  assert.ok(ablMetrics.estimatedTotalPowerMw < stdMetrics.estimatedTotalPowerMw)
  assert.ok(auditSchemeContrast(lightAblGuarded).every((i) => i.wcagPassAA && i.apcaPass))

  // ADR-002 Option B: woled-desktop models WRGB white-subpixel power savings
  const lightWoled = buildDynamicScheme('#2563EB', {
    mode: 'light',
    emissive: { profile: 'woled-desktop' },
  })
  const woledMetrics = analyzeEmissiveSchemeMetrics(lightWoled, 'woled-desktop')
  assert.ok(woledMetrics.estimatedTotalPowerMw < stdMetrics.estimatedTotalPowerMw)
  assert.ok(auditSchemeContrast(lightWoled).every((i) => i.wcagPassAA && i.apcaPass))

  // ADR-003 Option A & B: linear-light CVD simulation & semantic separability audit
  assert.equal(simulateCvd('#2563EB', 'none'), '#2563EB')
  assert.equal(simulateCvd('#2563EB', 'deuteranopia', 0), '#2563EB')
  const achrom = simulateCvd('#FF0000', 'achromatopsia')
  assert.ok(Math.abs(hexToOkyct(achrom).t - hexToOkyct('#FF0000').t) < 0.6)
  const cvdAudit = auditSchemeCvd(lightStandard)
  assert.equal(cvdAudit.length, 18)
  const strictAudit = auditSchemeCvd(lightStandard, { minDeltaE: 0.5, minDeltaTone: 50 })
  assert.ok(strictAudit.some((i) => !i.separable))

  // ADR-005 Option C: ambient surround adaptation ('bright' & 'darkroom')
  const brightDark = buildDynamicScheme('#2563EB', { mode: 'dark', ambient: 'bright' })
  const normalDark = buildDynamicScheme('#2563EB', { mode: 'dark', ambient: 'normal' })
  const darkroomLight = buildDynamicScheme('#2563EB', { mode: 'light', ambient: 'darkroom' })
  assert.ok(brightDark.tones.surface > normalDark.tones.surface)
  assert.ok(darkroomLight.tones.surface <= 90.3)
  assert.ok(auditSchemeContrast(brightDark).every((i) => i.wcagPassAA && i.apcaPass))
  assert.ok(auditSchemeContrast(darkroomLight).every((i) => i.wcagPassAA && i.apcaPass))

  // ADR-006 Option B & C: stateLayersBlendSpace & stateLayersContrastGuard
  const gammaLayers = buildDynamicScheme('#2563EB', {
    mode: 'dark',
    stateLayers: ['dragged'],
    stateLayersBlendSpace: 'gamma-srgb',
  })
  const okyctLayers = buildDynamicScheme('#2563EB', {
    mode: 'dark',
    stateLayers: ['dragged'],
    stateLayersBlendSpace: 'okyct',
  })
  assert.notEqual(gammaLayers.primaryDragged, okyctLayers.primaryDragged)

  const guarded = buildDynamicScheme('#2563EB', {
    mode: 'light',
    contrastLevel: -0.5,
    stateLayers: ['pressed', 'dragged'],
    stateLayersContrastGuard: true,
  })
  assert.ok(getContrastRatio(guarded.primaryPressed!, guarded.onPrimary) >= 4.5)
  assert.ok(getContrastRatio(guarded.primaryDragged!, guarded.onPrimary) >= 4.5)
  assert.ok(getContrastRatio(guarded.surfaceDragged!, guarded.onSurface) >= 4.5)

  // Custom colors stateLayersBlendSpace & stateLayersContrastGuard via createTheme + export
  const customGuardedTheme = createTheme({
    sourceHex: '#2563EB',
    contrastLevel: -0.5,
    customColors: [{ name: 'brand', sourceHex: '#F59E0B' }],
    stateLayers: ['pressed', 'dragged'],
    stateLayersBlendSpace: 'gamma-srgb',
    stateLayersContrastGuard: true,
  })
  const customOkyctTheme = createTheme({
    sourceHex: '#2563EB',
    contrastLevel: -0.5,
    customColors: [{ name: 'brand', sourceHex: '#F59E0B' }],
    stateLayers: ['pressed', 'dragged'],
    stateLayersBlendSpace: 'okyct',
    stateLayersContrastGuard: false,
  })
  const customLightGuarded = customGuardedTheme.customColors.light[0]!
  const customLightUnguarded = customOkyctTheme.customColors.light[0]!
  assert.notEqual(
    customLightGuarded.stateLayers?.colorDragged,
    customLightUnguarded.stateLayers?.colorDragged
  )
  assert.ok(
    getContrastRatio(customLightGuarded.stateLayers!.colorDragged!, customLightGuarded.onColor) >= 4.5
  )
  assert.ok(
    getContrastRatio(customLightGuarded.stateLayers!.onColorDragged!, customLightGuarded.color) >= 4.5
  )
  assert.ok(
    getContrastRatio(
      customLightGuarded.stateLayers!.colorContainerDragged!,
      customLightGuarded.onColorContainer
    ) >= 4.5
  )
  assert.ok(
    getContrastRatio(
      customLightGuarded.stateLayers!.onColorContainerDragged!,
      customLightGuarded.colorContainer
    ) >= 4.5
  )

  const exportedCss = customGuardedTheme.export('css', { stateLayers: ['dragged'] })
  assert.ok(
    exportedCss.includes(
      `--md-sys-color-primary-dragged: light-dark(${customGuardedTheme.schemes.light.primaryDragged}, ${customGuardedTheme.schemes.dark.primaryDragged});`
    )
  )
  assert.ok(
    exportedCss.includes(
      `--md-custom-color-brand-dragged: light-dark(${customLightGuarded.stateLayers!.colorDragged}, ${customGuardedTheme.customColors.dark[0]!.stateLayers!.colorDragged});`
    )
  )

  // Input validation edge cases
  assert.throws(() => okyctToOklchCss({ h: 200, c: -0.1, t: 50 }))
  assert.throws(() => okyctToOklchCss({ h: 200, c: 0.1, t: 120 }))
  assert.throws(() => simulateCvd('not-a-hex', 'none'))
  assert.throws(() => simulateCvd('not-a-hex', 'deuteranopia', 0))
  assert.throws(() => auditSchemeCvd(lightStandard, { cvdTypes: ['none' as never] }))
  assert.throws(() => auditSchemeCvd(lightStandard, { minDeltaE: -0.1 }))
})
