
import { hexToOkyct, okyctToHex } from '../../../domain/index.ts'
import type { EmissivePanelType } from '../../../ports/outbound/display-physics.port.ts'

export function applySubpixelEdgeCompensation(
  hex: string,
  profile: EmissivePanelType,
  roleKind: 'surface' | 'foreground' | 'accent'
): string {
  const okyct = hexToOkyct(hex)

  if (profile === 'amoled-anti-smear') {
    if (roleKind === 'foreground' || roleKind === 'accent') {
      const dampedC = okyct.c > 0.14 ? 0.14 + (okyct.c - 0.14) * 0.78 : okyct.c
      const clampedT = roleKind === 'foreground' && okyct.t > 97 ? 97 : okyct.t
      return okyctToHex({ h: okyct.h, c: dampedC, t: clampedT })
    }
  } else if (profile === 'micro-oled-xr') {
    if (roleKind === 'foreground' && okyct.t > 92) {
      return okyctToHex({ h: okyct.h, c: okyct.c * 0.9, t: 92 })
    }
    if (roleKind === 'accent' && okyct.c > 0.15) {
      return okyctToHex({ h: okyct.h, c: okyct.c * 0.85, t: Math.min(90, okyct.t) })
    }
  }

  return hex
}
