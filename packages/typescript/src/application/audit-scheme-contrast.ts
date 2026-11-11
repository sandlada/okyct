
import { getContrastRatio, getApcaContrast } from '../domain/index.ts'
import type { SystemColorToken, DynamicSchemeColors, ContrastAuditItem } from '../ports/inbound/scheme-building.port.ts'

export function auditSchemeContrast(scheme: DynamicSchemeColors): ContrastAuditItem[] {
  const pairs: ReadonlyArray<{
    fg: SystemColorToken
    bg: SystemColorToken
    minRatio: number
    minApca: number
  }> = [
    { fg: 'onPrimary', bg: 'primary', minRatio: 4.5, minApca: 60 },
    { fg: 'onPrimaryContainer', bg: 'primaryContainer', minRatio: 4.5, minApca: 60 },
    { fg: 'onPrimaryFixed', bg: 'primaryFixed', minRatio: 4.5, minApca: 60 },
    { fg: 'onPrimaryFixedVariant', bg: 'primaryFixedDim', minRatio: 4.5, minApca: 60 },
    { fg: 'onSecondary', bg: 'secondary', minRatio: 4.5, minApca: 60 },
    { fg: 'onSecondaryContainer', bg: 'secondaryContainer', minRatio: 4.5, minApca: 60 },
    { fg: 'onTertiary', bg: 'tertiary', minRatio: 4.5, minApca: 60 },
    { fg: 'onTertiaryContainer', bg: 'tertiaryContainer', minRatio: 4.5, minApca: 60 },
    { fg: 'onSurface', bg: 'surface', minRatio: 4.5, minApca: 60 },
    { fg: 'onSurfaceVariant', bg: 'surfaceVariant', minRatio: 4.5, minApca: 60 },
    { fg: 'onSurface', bg: 'surfaceContainer', minRatio: 4.5, minApca: 60 },
    { fg: 'onError', bg: 'error', minRatio: 4.5, minApca: 60 },
    { fg: 'onErrorContainer', bg: 'errorContainer', minRatio: 4.5, minApca: 60 },
    { fg: 'onWarning', bg: 'warning', minRatio: 4.5, minApca: 60 },
    { fg: 'onWarningContainer', bg: 'warningContainer', minRatio: 4.5, minApca: 60 },
    { fg: 'onSuccess', bg: 'success', minRatio: 4.5, minApca: 60 },
    { fg: 'onSuccessContainer', bg: 'successContainer', minRatio: 4.5, minApca: 60 },
    { fg: 'onInfo', bg: 'info', minRatio: 4.5, minApca: 60 },
    { fg: 'onInfoContainer', bg: 'infoContainer', minRatio: 4.5, minApca: 60 },
    { fg: 'inverseOnSurface', bg: 'inverseSurface', minRatio: 4.5, minApca: 60 },
    { fg: 'inverseOnPrimary', bg: 'inversePrimary', minRatio: 4.5, minApca: 60 },
    { fg: 'inverseOnPrimaryContainer', bg: 'inversePrimaryContainer', minRatio: 4.5, minApca: 60 },
    { fg: 'outline', bg: 'surface', minRatio: 3.0, minApca: 45 },
  ]

  return pairs.map((p) => {
    const fgTone = scheme.tones[p.fg] ?? 50
    const bgTone = scheme.tones[p.bg] ?? 50
    const wcag = getContrastRatio(fgTone, bgTone)
    const apca = Math.abs(getApcaContrast(fgTone, bgTone))

    return {
      fgRole: p.fg,
      bgRole: p.bg,
      fgTone,
      bgTone,
      wcagRatio: parseFloat(wcag.toFixed(2)),
      wcagPassAA: wcag >= p.minRatio,
      wcagPassAAA: wcag >= 7.0,
      apcaLc: apca,
      apcaPass: apca >= p.minApca,
    }
  })
}
