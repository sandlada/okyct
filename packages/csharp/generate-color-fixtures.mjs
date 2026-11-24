import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import * as core from '../typescript/src/domain/index.ts'
import * as application from '../typescript/src/application/index.ts'
import * as adapters from '../typescript/src/adapters/index.ts'

const fixtures = []
function add(api, args) {
  try {
    fixtures.push({ api, args, expected: core[api](...args) })
  } catch {
    fixtures.push({ api, args, throws: true })
  }
}

const seeds = ['#000', '#fff', '#787878', ' \t\n\r\f#2563EB ', '#0000ff', '#ff0000', '#ffd600', '#ff00ff', '#09a']
for (const seed of seeds) {
  add('hexToRgb', [seed])
  add('hexToOkyct', [seed])
  add('rgbToOkyct', [core.hexToRgb(seed)])
  add('rgbToHex', [core.hexToRgb(seed)])
  add('getDeltaEOklab', [seed, '#09f'])
  add('getDeltaE2000', [seed, '#09f'])
  for (const type of core.CvdTypes) {
    add('simulateCvd', [seed, type, 0.5])
  }
}

for (const hue of [-15, 0, 30, 90, 180, 239.25, 265, 300, 359.9, 410]) {
  add('shortestHueDelta', [hue, 357.25])
  for (const gamut of core.GamutTargets) {
    add('findGamutCusp', [hue, { gamut }])
    for (const t of [0, 0.001, 4.25, 8, 41.5, 84, 99.999, 100]) {
      const color = { h: hue, c: 0.38, t }
      add('findMaxChromaForTone', [hue, t, { gamut }])
      add('isInGamut', [color, { gamut }])
      for (const gamutMapping of core.GamutMappingModes) {
        add('okyctToRgb', [color, { gamut, gamutMapping }])
        if (gamut === 'srgb') add('okyctToHex', [color, { gamut, gamutMapping }])
        if (gamut === 'display-p3') add('okyctToDisplayP3Css', [color, { gamutMapping }])
      }
      if (gamut === 'srgb') add('okyctToOklchCss', [color])
    }
  }
}

for (const t of [0, 0.001, 4, 7.9999, 8, 8.0001, 15.6, 50, 80, 99.999, 100]) {
  add('toneToY', [t])
  add('yToTone', [core.toneToY(t)])
  add('getContrastRatio', [t, '#42c'])
  add('getApcaContrast', [t, '#42c'])
  add('getApcaContrast', ['#42c', t])
  for (const lc of [0, 45, 60, 75, 108]) add('solveTonesForApca', [t, lc])
  for (const metric of core.ContrastMetrics) {
    add('solveTonesForContrast', [t, 4.5, { metric, targetLc: 60 }])
  }
}

for (const channel of [-0.1, 0, 0.0031308, 0.04045, 0.5, 1, 1.2]) {
  add('srgbToLinear', [channel])
  add('linearToSrgb', [channel])
}
add('isInSrgbGamut', [265, 0.2, 55])
add('isInSrgbGamut', [{ h: 120, c: 0.42, t: 50 }])
add('getContrastRatio', [{ h: 265, c: 0.38, t: 50 }, '#fff'])

add('hexToRgb', ['#xxxxxx'])
add('hexToRgb', ['\u0085#fff'])
add('hexToRgb', ['\uFEFF#fff'])
add('hexToRgb', ['\u00A0#fff'])
add('hexToRgb', ['\u3000#fff'])
add('okyctToHex', [{ h: 0, c: 0.1, t: 50 }, { gamut: 'display-p3' }])
add('okyctToRgb', [{ h: 0, c: -0.1, t: 50 }, {}])
add('solveTonesForApca', [50, 110])
add('solveTonesForContrast', [101, 4.5, {}])
fixtures.push({
  api: 'invariants',
  args: [],
  expected: core.runColorimetricInvariantSuite().map(({ measuredValue, ...meta }) => meta),
})

for (const seed of ['#0000ff', '#ffd600', '#777', '#09a']) {
  for (const variant of ['tonalSpot', 'vibrant', 'expressive', 'neutral', 'monochrome', 'fidelity']) {
    const palettes = application.createPalettesFromSource(seed, { variant, gamut: 'display-p3' })
    const expected = Object.values(palettes).map(palette => ({
      hue: palette.hue,
      targetChroma: palette.targetChroma,
      tones: [4.5, 40, 99].map(tone => palette.tone(tone)),
      p3Css: palette.toneCss(42.25, 'display-p3'),
    }))
    fixtures.push({ api: 'palettes', args: [seed, variant], expected })
  }
}

const layers = [{ color: '#f07', opacity: 0.125, label: 'Selection' }, { color: '#08f', opacity: 0.54 }]
for (const space of ['linear-srgb', 'gamma-srgb', 'okyct']) {
  const composited = application.stackLayers({ blendSpace: space })(layers)('#128')
  fixtures.push({ api: 'stack', args: [layers, space], expected: composited })
}
const cssMix = application.stackToCssColorMix({ space: 'oklch' })(layers)('var(--surface)')
fixtures.push({ api: 'cssMix', args: [layers], expected: cssMix })
const statePair = { base: '#89a', stateColor: '#afa' }
const stacked = application.stackStateLayers(['hover', 'pressed', 'dragged'])(statePair)
fixtures.push({ api: 'stackStates', args: [statePair], expected: stacked })
fixtures.push({ api: 'stackAudit', args: [statePair, '#aaa'], expected: application.auditStackedContrast('#aaa')(stacked) })

for (const mode of ['hue-tone-grid', 'hue-histogram']) {
  for (const data of [[], [0, 0, 0, 255, 9, 67, 200, 127], [
    22, 99, 218, 255, 244, 110, 55, 128, 23, 198, 117, 255, 22, 99, 218, 255,
  ]]) {
    const image = { data, width: data.length / 4, height: 1 }
    fixtures.push({ api: 'quantize', args: [image, mode], expected: adapters.extractSeedsFromImageData(image, { mode }) })
  }
}

for (const seed of ['#0000ff', '#ffd600', '#09a']) {
  for (const profile of ['standard-lcd', 'oled-true-black', 'amoled-anti-smear', 'micro-oled-xr', 'woled-desktop']) {
    for (const mode of ['light', 'dark']) {
      const palettes = application.createPalettesFromSource(seed, { gamut: 'display-p3' })
      const options = { mode, contrastLevel: 0.6, emissive: { profile, burnInGuard: true, antiFringing: true, ablGuard: true },
        stateLayers: ['pressed', 'dragged'], stateLayersContrastGuard: true }
      const { tones, okyct, stateLayers, ...colors } = adapters.buildDynamicScheme(palettes, options)
      fixtures.push({ api: 'scheme', args: [seed, profile, mode], expected: { colors, tones, okyct, stateLayers } })
    }
  }
}

const theme = adapters.createTheme({
  sourceHex: '#2563eb',
  customColors: [
    { name: 'brandAccent😀', sourceHex: '#e93', label: '品牌輔色😀' },
    { name: 'ext𠮷Glyph', sourceHex: '#39e', label: '擴充𠮷 "literal \\uD83D\\uDE00"' },
  ],
  emissive: { profile: 'woled-desktop', burnInGuard: true },
  stateLayers: ['dragged', 'hovered'],
  gamut: 'display-p3',
})
fixtures.push({ api: 'themeTokens', args: [], expected: theme.tokens() })
fixtures.push({ api: 'themeCustomColors', args: [], expected: theme.customColors.dark })
fixtures.push({ api: 'contrastAudit', args: [], expected: theme.auditContrast() })
fixtures.push({ api: 'cvdAudit', args: [], expected: application.auditSchemeCvd(theme.scheme()) })
fixtures.push({ api: 'telemetry', args: [], expected: theme.analyzeEmissive() })
for (const px of ['#000000', '#000001', '#010101', '#020202']) {
  fixtures.push({ api: 'pixelTelemetry', args: [px], expected: adapters.computeColorEmissiveTelemetry(px) })
}
for (const format of ['css', 'tailwind', 'w3c', 'ts']) {
  for (const colorFormat of ['hex', 'oklch', 'display-p3']) {
    const output = theme.export(format, { colorFormat, stateLayers: ['pressed'] })
    if (format === 'w3c' && colorFormat === 'hex') {
      fixtures.push({ api: 'exportJson', args: [colorFormat], expected: JSON.parse(output) })
    } else {
      fixtures.push({ api: 'exportHash', args: [format, colorFormat, 'light-dark'],
        expected: createHash('sha256').update(output).digest('hex') })
    }
  }
}
fixtures.push({ api: 'exportHash', args: ['css', 'hex', 'class'],
  expected: createHash('sha256').update(theme.export('css', { cssSchemeMode: 'class', stateLayers: ['pressed'] })).digest('hex') })

const source = {
  '--PrimaryAccent': '#f07',
  neutral: '#010101',
  'neutral-low': '#040404',
  background: '#000',
  blue: '#15f',
  nelInvalid: '\u0085#fff',
  bomInvalid: '\uFEFF#fff',
}
const reference = { neutral: '#000', extra: '#fff' }
const styled = adapters.withPrefix('ui')(adapters.renameCase('kebab')(source))
const fp = {
  styled,
  nested: adapters.nestTokens()(source),
  roundTrip: adapters.flattenTokens()(adapters.nestTokens()(source)),
  picked: adapters.pickTokens(['blue', 'neutral'])(source),
  omitted: adapters.omitTokens(['blue'])(source),
  filtered: adapters.filterTokens(key => key.includes('neutral'))(source),
  mapped: adapters.mapTokens(adapters.withAlpha(0.5))(source),
  css: adapters.toCssRuleBlock(' :root ')(styled),
  variable: adapters.toCssVarRef({ prefix: '--ui', fallback: '#fff' })('--PrimaryAccent'),
  contract: adapters.validateContract(['PrimaryAccent', 'missing'])(source),
  diff: adapters.diffThemeParity(reference)(source),
  optimized: adapters.optimizeForOled({ profile: 'amoled-anti-smear', burnInGuard: true })(source),
  guarded: adapters.limitBlueEmission()('#0000ff'),
  power: adapters.auditOledPower()(source),
}
fixtures.push({ api: 'tokenOperators', args: [source, reference], expected: fp })

const target = new URL('./Sandlada.Okyct.Tests/color-science.json', import.meta.url)
const output = fixtures.map(test => JSON.stringify(test)).join(',\n')
const payload = '[\n' + output + '\n]\n'
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8').replaceAll('\r\n', '\n') !== payload) {
    throw new Error('The TypeScript color science fixtures have changed.')
  }
} else {
  writeFileSync(target, payload)
}
