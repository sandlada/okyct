
import { hexToOkyct, getContrastRatio } from '../../domain/index.ts'
import type { DynamicSchemeColors } from '../../ports/inbound/scheme-building.port.ts'
import type { EmissivePanelType, SchemeEmissiveReport } from '../../ports/outbound/display-physics.port.ts'
import { EmissivePanelSpecs } from './emissive-panel-specs.ts'
import { computeColorEmissiveTelemetry } from './compute-color-emissive-telemetry.ts'

const BackplaneStaticMw = 95
const LcdConstantBacklightMw = 540

const UiAreaWeights: ReadonlyArray<{ role: keyof DynamicSchemeColors; weight: number }> = [
  { role: 'surface', weight: 0.42 },
  { role: 'surfaceContainerLowest', weight: 0.14 },
  { role: 'surfaceContainerLow', weight: 0.12 },
  { role: 'surfaceContainer', weight: 0.12 },
  { role: 'surfaceContainerHigh', weight: 0.06 },
  { role: 'primary', weight: 0.05 },
  { role: 'primaryContainer', weight: 0.04 },
  { role: 'secondaryContainer', weight: 0.02 },
  { role: 'onSurface', weight: 0.02 },
  { role: 'onSurfaceVariant', weight: 0.01 },
]

export function analyzeEmissiveSchemeMetrics(
  scheme: DynamicSchemeColors,
  profile: EmissivePanelType
): SchemeEmissiveReport {
  const spec = EmissivePanelSpecs[profile]

  if (profile === 'standard-lcd') {
    let weightedApl = 0
    let weightedBlueStress = 0
    for (const item of UiAreaWeights) {
      const hex = scheme[item.role] as string
      const t = computeColorEmissiveTelemetry(hex)
      weightedApl += t.aplPercent * item.weight
      weightedBlueStress += t.blueStressIndex * item.weight
    }

    const minContrast = Math.min(
      getContrastRatio(scheme.tones.onPrimary, scheme.tones.primary),
      getContrastRatio(scheme.tones.onSurface, scheme.tones.surface)
    )

    return {
      profile,
      spec,
      estimatedTotalPowerMw: LcdConstantBacklightMw,
      powerSavingsVsLcdPct: 0,
      channelPowerBreakdownMw: { r: 180, g: 180, b: 180 },
      aplPercent: Math.round(weightedApl * 10) / 10,
      ablTriggerRisk: 'Low',
      blueSubpixelStressIndex: Math.round(weightedBlueStress),
      smearRiseTimeMs: spec.smearRiseTimeMs,
      blackSmearRisk: 'None',
      pentileFringingRisk: 'Low',
      pixelOffRatioPct: 0,
      minWcagContrastAfterOpt: Math.round(minContrast * 100) / 100,
    }
  }

  let weightedR = 0
  let weightedG = 0
  let weightedB = 0
  let weightedApl = 0
  let weightedBlueStress = 0
  let pixelOffArea = 0

  for (const item of UiAreaWeights) {
    const hex = scheme[item.role] as string
    const t = computeColorEmissiveTelemetry(hex)
    weightedR += t.channelPowerMw.r * item.weight
    weightedG += t.channelPowerMw.g * item.weight
    weightedB += t.channelPowerMw.b * item.weight
    weightedApl += t.aplPercent * item.weight
    weightedBlueStress += t.blueStressIndex * item.weight
    if (t.isPixelOff) {
      pixelOffArea += item.weight
    }
  }

  const primaryTelemetry = computeColorEmissiveTelemetry(scheme.primary)
  const effectiveBlueStress = Math.round(
    weightedBlueStress * 0.55 + primaryTelemetry.blueStressIndex * 0.45
  )

  const emissiveLightMw = weightedR + weightedG + weightedB
  const totalMw = Math.round(BackplaneStaticMw + emissiveLightMw)
  const savingsPct = Math.round(
    ((LcdConstantBacklightMw - totalMw) / LcdConstantBacklightMw) * 100
  )

  const surfTone = scheme.tones.surface
  const lowTone = scheme.tones.surfaceContainerLowest
  const hasZeroCutoff = surfTone === 0 || lowTone === 0
  const blackSmearRisk: SchemeEmissiveReport['blackSmearRisk'] = hasZeroCutoff
    ? 'Severe (T=0 Cutoff)'
    : surfTone <= 2
    ? 'Minimal'
    : 'None'

  const ablTriggerRisk: SchemeEmissiveReport['ablTriggerRisk'] =
    weightedApl > 65 ? 'High' : weightedApl > 38 ? 'Moderate' : 'Low'

  const primaryOkyct = hexToOkyct(scheme.primary)
  const pentileFringingRisk: SchemeEmissiveReport['pentileFringingRisk'] =
    profile === 'amoled-anti-smear'
      ? 'Controlled'
      : primaryOkyct.c > 0.17
      ? 'Elevated'
      : 'Low'

  const minContrast = Math.min(
    getContrastRatio(scheme.tones.onPrimary, scheme.tones.primary),
    getContrastRatio(scheme.tones.onSurface, scheme.tones.surface)
  )

  return {
    profile,
    spec,
    estimatedTotalPowerMw: totalMw,
    powerSavingsVsLcdPct: savingsPct,
    channelPowerBreakdownMw: {
      r: Math.round(weightedR * 10) / 10,
      g: Math.round(weightedG * 10) / 10,
      b: Math.round(weightedB * 10) / 10,
    },
    aplPercent: Math.round(weightedApl * 10) / 10,
    ablTriggerRisk,
    blueSubpixelStressIndex: effectiveBlueStress,
    smearRiseTimeMs: hasZeroCutoff ? 18.5 : spec.smearRiseTimeMs,
    blackSmearRisk,
    pentileFringingRisk,
    pixelOffRatioPct: Math.round(pixelOffArea * 100),
    minWcagContrastAfterOpt: Math.round(minContrast * 100) / 100,
  }
}
