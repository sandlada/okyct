
import type { EmissivePanelType, EmissivePanelSpec, IDisplayPhysicsPort } from '../../../ports/outbound/display-physics.port.ts'
import { EmissivePanelSpecs } from '../emissive-panel-specs.ts'
import { applyBlueBurnInGuard } from '../apply-blue-burn-in-guard.ts'
import { applySubpixelEdgeCompensation } from './apply-subpixel-edge-compensation.ts'
import { computeColorEmissiveTelemetry } from '../compute-color-emissive-telemetry.ts'
import { analyzeEmissiveSchemeMetrics } from '../analyze-emissive-scheme-metrics.ts'

export class OledDisplayPhysicsAdapter implements IDisplayPhysicsPort {
  getPanelSpec(profile: EmissivePanelType): EmissivePanelSpec {
    return EmissivePanelSpecs[profile]
  }
  applyBlueBurnInGuard = applyBlueBurnInGuard
  applySubpixelEdgeCompensation = applySubpixelEdgeCompensation
  computeColorEmissiveTelemetry = computeColorEmissiveTelemetry
  analyzeEmissiveSchemeMetrics = analyzeEmissiveSchemeMetrics
}

export const OledDisplayPhysicsSingleton = new OledDisplayPhysicsAdapter()
