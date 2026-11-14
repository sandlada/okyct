/**
 * [Hexagonal Layer: Application Service]
 * Audits semantic role pairs in a DynamicSchemeColors under CVD projections
 * to detect pairs that lose chromatic and luminance separability.
 */

import {
  CvdTypes,
  getDeltaEOklab,
  hexToOkyct,
  simulateCvd,
  type CvdType,
} from '../domain/index.ts'
import type {
  AuditSchemeCvdOptions,
  CvdSeparabilityAuditItem,
  DynamicSchemeColors,
  SystemColorToken,
} from '../ports/inbound/scheme-building.port.ts'

const DefaultCvdTypes: readonly Exclude<CvdType, 'none'>[] = [
  'protanopia',
  'deuteranopia',
  'tritanopia',
]

const SemanticAuditPairs: ReadonlyArray<readonly [SystemColorToken, SystemColorToken]> = [
  ['error', 'success'],
  ['error', 'warning'],
  ['warning', 'success'],
  ['primary', 'error'],
  ['primary', 'tertiary'],
  ['errorContainer', 'successContainer'],
]

export function auditSchemeCvd(
  scheme: DynamicSchemeColors,
  options: AuditSchemeCvdOptions = {}
): CvdSeparabilityAuditItem[] {
  if (scheme === null || typeof scheme !== 'object' || Array.isArray(scheme)) {
    throw new Error('Invalid scheme input: expected a DynamicSchemeColors object.')
  }
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Invalid auditSchemeCvd options: expected an object.')
  }

  const cvdTypes = options.cvdTypes ?? DefaultCvdTypes
  if (!Array.isArray(cvdTypes)) {
    throw new Error('Invalid cvdTypes option: expected an array of CVD types.')
  }
  for (const cvdType of cvdTypes) {
    if (!CvdTypes.includes(cvdType) || cvdType === 'none') {
      throw new Error(
        `Invalid cvdType in auditSchemeCvd: "${String(cvdType)}". Expected protanopia, deuteranopia, tritanopia, or achromatopsia.`
      )
    }
  }
  const severity = options.severity ?? 1.0
  const minDeltaE = options.minDeltaE ?? 0.06
  const minDeltaTone = options.minDeltaTone ?? 12
  if (!Number.isFinite(minDeltaE) || minDeltaE < 0) {
    throw new Error(`Invalid minDeltaE: ${minDeltaE}. Expected a finite number >= 0.`)
  }
  if (!Number.isFinite(minDeltaTone) || minDeltaTone < 0) {
    throw new Error(`Invalid minDeltaTone: ${minDeltaTone}. Expected a finite number >= 0.`)
  }

  const items: CvdSeparabilityAuditItem[] = []
  for (const cvdType of cvdTypes) {
    for (const [roleA, roleB] of SemanticAuditPairs) {
      const projA = simulateCvd(scheme[roleA], cvdType, severity)
      const projB = simulateCvd(scheme[roleB], cvdType, severity)
      const deltaEOklab = Math.round(getDeltaEOklab(projA, projB) * 10000) / 10000
      const deltaTone =
        Math.round(Math.abs(hexToOkyct(projA).t - hexToOkyct(projB).t) * 100) / 100

      const separable = deltaEOklab >= minDeltaE || deltaTone >= minDeltaTone
      items.push({
        roleA,
        roleB,
        cvdType,
        deltaEOklab,
        deltaTone,
        separable,
        recommendation: separable
          ? 'OK'
          : `Low ${cvdType} separability (ΔE=${deltaEOklab}, ΔT=${deltaTone}): separate Tone by >=${minDeltaTone} or shift hue/iconography.`,
      })
    }
  }

  return items
}
