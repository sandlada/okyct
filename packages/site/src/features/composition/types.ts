import type { EmissivePanelType } from '../../color/emissive.ts'
import type { NamingCase } from '../../color/fp.ts'

export type { EmissivePanelType, NamingCase }

export const BlendSpaces = ['linear-srgb', 'okyct', 'gamma-srgb'] as const
export type BlendSpace = (typeof BlendSpaces)[number]

export const OperatorKinds = [
  'pickTokens',
  'omitTokens',
  'renameCase',
  'withPrefix',
  'mapWithAlpha',
  'optimizeForOled',
  'auditOledPower',
  'nestTokens',
  'toCssRuleBlock',
  'validateContract',
] as const

export type OperatorKind = (typeof OperatorKinds)[number]

export const StackLayerRoles = ['hover', 'focus', 'pressed', 'custom'] as const
export type StackLayerRole = (typeof StackLayerRoles)[number]

export interface StackLayer {
  color: string
  opacity: number
  defaultOpacity: number
  role: StackLayerRole
  label: string
}

export interface PipelineStep {
  id: string
  op: OperatorKind
  enabled: boolean
  keysArg: string
  caseArg: NamingCase
  prefixArg: string
  alphaArg: number
  selectorArg: string
  separatorArg: string
  oledProfileArg?: EmissivePanelType
  burnInGuardArg?: boolean
}

export type PipelinePreset = 'css' | 'nested-json' | 'contract' | 'oled'
export type CodeTab = 'output' | 'ts-code'

export function blankStep(partial: Pick<PipelineStep, 'id' | 'op'> & Partial<PipelineStep>): PipelineStep {
  return {
    enabled: true,
    keysArg: '',
    caseArg: 'kebab',
    prefixArg: '--okyct-color',
    alphaArg: 0.85,
    selectorArg: ':root',
    separatorArg: '-',
    ...partial,
  }
}
