
import { hexToOkyct, okyctToHex } from '../../domain/index.ts'
import { EmissivePanelTypes, type EmissivePanelType } from '../../ports/index.ts'
import { EmissivePanelSpecs } from './emissive-panel-specs.ts'
import { applyBlueBurnInGuard } from './apply-blue-burn-in-guard.ts'
import { applySubpixelEdgeCompensation } from './internal/apply-subpixel-edge-compensation.ts'

export function applyEmissiveProfileToTokenHex(
  key: string,
  hex: string,
  options: {
    profile: EmissivePanelType
    burnInGuard?: boolean
    antiFringing?: boolean
  }
): string {
  if (!EmissivePanelTypes.includes(options.profile)) {
    throw new Error(
      `Invalid emissive profile: "${String(options.profile)}". Expected one of: ${EmissivePanelTypes.join(', ')}.`
    )
  }
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex.trim())) return hex

  const lowerKey = key.toLowerCase()
  const okyct = hexToOkyct(hex)
  const spec = EmissivePanelSpecs[options.profile]

  let targetT = okyct.t
  let targetC = okyct.c

  if (okyct.t <= 28 && (lowerKey.includes('surface') || lowerKey.includes('background'))) {
    if (lowerKey.includes('lowest')) {
      targetT = spec.darkSurfaceTones.lowest
    } else if (lowerKey.includes('low')) {
      targetT = spec.darkSurfaceTones.low
    } else if (lowerKey.includes('highest')) {
      targetT = spec.darkSurfaceTones.highest
    } else if (lowerKey.includes('high')) {
      targetT = spec.darkSurfaceTones.high
    } else if (lowerKey.includes('bright')) {
      targetT = spec.darkSurfaceTones.bright
    } else if (lowerKey.includes('container')) {
      targetT = spec.darkSurfaceTones.container
    } else {
      targetT = spec.darkSurfaceTones.surface
    }
    if (targetT === 0) targetC = 0
  } else if (okyct.t > spec.lightPeakToneCap) {
    targetT = spec.lightPeakToneCap
  }

  let outHex = targetT === 0 ? '#000000' : okyctToHex({ h: okyct.h, c: targetC, t: targetT })

  if (options.burnInGuard) {
    outHex = applyBlueBurnInGuard(outHex)
  }

  if (options.antiFringing) {
    const roleKind = lowerKey.includes('on')
      ? 'foreground'
      : lowerKey.includes('surface')
      ? 'surface'
      : 'accent'
    outHex = applySubpixelEdgeCompensation(outHex, options.profile, roleKind)
  }

  return outHex
}
