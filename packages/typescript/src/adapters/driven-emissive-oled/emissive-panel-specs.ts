import {
  DefaultEmissivePanelSpecs,
  type EmissivePanelSpec,
  type EmissivePanelType,
} from '../../ports/outbound/display-physics.port.ts'

export const EmissivePanelSpecs: Record<EmissivePanelType, EmissivePanelSpec> =
  DefaultEmissivePanelSpecs
