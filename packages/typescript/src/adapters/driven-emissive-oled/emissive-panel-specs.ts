import {
  DefaultEmissivePanelSpecs,
  type EmissivePanelSpec,
  type EmissivePanelType,
} from '../../ports/index.ts'

export const EmissivePanelSpecs: Readonly<Record<EmissivePanelType, EmissivePanelSpec>> =
  DefaultEmissivePanelSpecs
