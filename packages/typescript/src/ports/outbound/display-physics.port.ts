/**
 * [Hexagonal Layer: Outbound Port]
 * Emissive display physics, subpixel power telemetry, and burn-in/anti-fringing compensation contract.
 * Constraint: depends only on domain/models and sibling port contracts.
 */

import {
  EmissivePanelTypes,
  type EmissivePanelType,
  type EmissiveSchemeOptions,
  type DynamicSchemeColors,
} from '../inbound/scheme-building.port.ts'

export { EmissivePanelTypes, type EmissivePanelType, type EmissiveSchemeOptions }

export const SubpixelGeometries = ['rgb-stripe', 'diamond-pentile', 'micro-oled-hex'] as const
export type SubpixelGeometry = (typeof SubpixelGeometries)[number]

export interface EmissivePanelSpec {
  id: EmissivePanelType
  name: string
  shortName: string
  badge: string
  subpixelGeometry: SubpixelGeometry
  geometryLabel: string
  description: string
  darkSurfaceTones: {
    lowest: number
    surface: number
    low: number
    container: number
    high: number
    highest: number
    bright: number
  }
  lightPeakToneCap: number
  smearRiseTimeMs: number
}

export const DefaultEmissivePanelSpecs: Record<EmissivePanelType, EmissivePanelSpec> = {
  'standard-lcd': {
    id: 'standard-lcd',
    name: 'Standard IPS / Mini-LED LCD',
    shortName: 'Standard LCD',
    badge: 'Global Backlight',
    subpixelGeometry: 'rgb-stripe',
    geometryLabel: 'RGB Stripe (Standard Vertical Subpixels)',
    description:
      'Relies on a constant backlight modulated by liquid crystals; power draw is largely independent of pixel tone with zero subpixel cutoff or burn-in.',
    darkSurfaceTones: {
      lowest: 4,
      surface: 6,
      low: 10,
      container: 12,
      high: 17,
      highest: 22,
      bright: 24,
    },
    lightPeakToneCap: 100,
    smearRiseTimeMs: 4.5,
  },
  'oled-true-black': {
    id: 'oled-true-black',
    name: 'OLED True-Black (Zero-Power Cutoff)',
    shortName: 'OLED True-Black',
    badge: 'T=0 Pixel Cutoff',
    subpixelGeometry: 'rgb-stripe',
    geometryLabel: 'RGB OLED (Self-Emissive Pixels)',
    description:
      'Anchors base dark surfaces to #000000 (T=0) to fully power down organic emitters for maximum static battery savings, trading off ~18.5 ms turn-on black smearing.',
    darkSurfaceTones: {
      lowest: 0,
      surface: 0,
      low: 4,
      container: 8,
      high: 13,
      highest: 18,
      bright: 22,
    },
    lightPeakToneCap: 100,
    smearRiseTimeMs: 18.5,
  },
  'amoled-anti-smear': {
    id: 'amoled-anti-smear',
    name: 'AMOLED 120Hz Anti-Smear (Pre-Biased)',
    shortName: 'AMOLED Anti-Smear',
    badge: 'T=4 Sub-Threshold Bias',
    subpixelGeometry: 'diamond-pentile',
    geometryLabel: 'Diamond PenTile (Subpixel-Shared Matrix)',
    description:
      'Tuned for 120Hz mobile AMOLED panels: holds lowest dark surfaces above sub-threshold turn-on (T=3..4) to eliminate scroll black smearing and tame PenTile fringing.',
    darkSurfaceTones: {
      lowest: 3,
      surface: 4,
      low: 8,
      container: 12,
      high: 16,
      highest: 21,
      bright: 24,
    },
    lightPeakToneCap: 98,
    smearRiseTimeMs: 1.6,
  },
  'micro-oled-xr': {
    id: 'micro-oled-xr',
    name: 'MicroOLED Silicon XR (Low-Halation)',
    shortName: 'MicroOLED XR',
    badge: 'Anti-Halation + Anti-ABL',
    subpixelGeometry: 'micro-oled-hex',
    geometryLabel: 'Silicon Tandem Micro-Cavity',
    description:
      'Engineered for XR headsets: raises dark velvet floor to T=8 and caps peak highlights at T=92 to suppress Pancake lens internal halation and backplane ABL dimming.',
    darkSurfaceTones: {
      lowest: 6,
      surface: 8,
      low: 12,
      container: 16,
      high: 20,
      highest: 25,
      bright: 28,
    },
    lightPeakToneCap: 92,
    smearRiseTimeMs: 0.4,
  },
}

export interface ColorEmissiveTelemetry {
  hex: string
  rLinear: number
  gLinear: number
  bLinear: number
  /** Spectral-weighted single-pixel power in mW (100% full white = 1000 mW reference). */
  powerMw: number
  /** Per-channel subpixel power breakdown (mW). */
  channelPowerMw: { r: number; g: number; b: number }
  /** Physical linear luminance APL [0, 100]%. */
  aplPercent: number
  /** Blue subpixel aging stress index [0, 100]. */
  blueStressIndex: number
  /** True when emitter is completely powered off (#000000). */
  isPixelOff: boolean
}

export interface SchemeEmissiveReport {
  profile: EmissivePanelType
  spec: EmissivePanelSpec
  estimatedTotalPowerMw: number
  powerSavingsVsLcdPct: number
  channelPowerBreakdownMw: { r: number; g: number; b: number }
  aplPercent: number
  ablTriggerRisk: 'Low' | 'Moderate' | 'High'
  blueSubpixelStressIndex: number
  smearRiseTimeMs: number
  blackSmearRisk: 'None' | 'Minimal' | 'Severe (T=0 Cutoff)'
  pentileFringingRisk: 'Low' | 'Controlled' | 'Elevated'
  pixelOffRatioPct: number
  minWcagContrastAfterOpt: number
}

export interface IDisplayPhysicsPort {
  getPanelSpec(profile: EmissivePanelType): EmissivePanelSpec
  applyBlueBurnInGuard(
    hex: string,
    options?: { maxBlueAttenuation?: number; hueShiftDeg?: number }
  ): string
  applySubpixelEdgeCompensation(
    hex: string,
    profile: EmissivePanelType,
    roleKind: 'surface' | 'foreground' | 'accent'
  ): string
  computeColorEmissiveTelemetry(hex: string): ColorEmissiveTelemetry
  analyzeEmissiveSchemeMetrics(
    scheme: DynamicSchemeColors,
    profile: EmissivePanelType
  ): SchemeEmissiveReport
}
