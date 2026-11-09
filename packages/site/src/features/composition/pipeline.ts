import { auditStackedContrast, stackLayers } from '../../color/stacker.ts'
import {
  auditOledPower,
  mapTokens,
  nestTokens,
  omitTokens,
  optimizeForOled,
  pickTokens,
  renameCase,
  toCssRuleBlock,
  validateContract,
  withAlpha,
  withPrefix,
  type TokenDictionary,
} from '../../color/fp.ts'
import { blankStep, type BlendSpace, type PipelineStep, type StackLayer } from './types.ts'

const StackPreviewModes = [
  { id: 'rest', roles: [] },
  { id: 'hover', roles: ['hover'] },
  { id: 'pressed', roles: ['pressed'] },
  { id: 'hoverPressed', roles: ['hover', 'pressed'] },
  { id: 'focused', roles: ['focus'] },
  { id: 'hoverFocused', roles: ['hover', 'focus'] },
  { id: 'pressedFocused', roles: ['pressed', 'focus'] },
  { id: 'hoverPressedFocused', roles: ['hover', 'pressed', 'focus'] },
] as const

export type StackPreviewId = (typeof StackPreviewModes)[number]['id']

export function buildStackPreviews(
  layers: readonly StackLayer[],
  baseColor: string,
  blendSpace: BlendSpace,
  foregroundText: string,
) {
  const stackOp = stackLayers({ blendSpace })
  const auditOp = auditStackedContrast(foregroundText)
  return StackPreviewModes.map((mode) => {
    const active = new Set<string>(mode.roles)
    const stacked = layers.filter((layer) => layer.role === 'custom' || active.has(layer.role))
    const composited = stackOp(stacked)(baseColor)
    const contrast = auditOp(composited)
    return {
      id: mode.id,
      hex: composited.finalHex,
      ratio: contrast.wcagRatio,
    }
  })
}

function formatOutput(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}

function splitKeys(raw: string): string[] {
  return raw.split(',').map((key) => key.trim()).filter(Boolean)
}

export function runPipeline(steps: readonly PipelineStep[], initial: TokenDictionary) {
  const snapshots: Array<{
    stepId: string
    op: PipelineStep['op']
    enabled: boolean
    outputFormatted: string
  }> = []
  let current: unknown = initial

  for (const step of steps) {
    if (!step.enabled) {
      snapshots.push({
        stepId: step.id,
        op: step.op,
        enabled: false,
        outputFormatted: formatOutput(current),
      })
      continue
    }

    const safeDict: TokenDictionary =
      typeof current === 'object' && current !== null && !('valid' in current)
        ? (current as TokenDictionary)
        : initial

    switch (step.op) {
      case 'pickTokens':
        current = pickTokens(splitKeys(step.keysArg))(safeDict)
        break
      case 'omitTokens':
        current = omitTokens(splitKeys(step.keysArg))(safeDict)
        break
      case 'renameCase':
        current = renameCase(step.caseArg)(safeDict)
        break
      case 'withPrefix':
        current = withPrefix(step.prefixArg)(safeDict)
        break
      case 'mapWithAlpha':
        current = mapTokens((value: string) => withAlpha(step.alphaArg)(value))(safeDict)
        break
      case 'nestTokens':
        current = nestTokens(step.separatorArg || '-')(safeDict)
        break
      case 'toCssRuleBlock':
        current = toCssRuleBlock(step.selectorArg || ':root')(safeDict)
        break
      case 'validateContract':
        current = validateContract(splitKeys(step.keysArg))(safeDict)
        break
      case 'optimizeForOled':
        current = optimizeForOled({
          profile: step.oledProfileArg || 'amoled-anti-smear',
          burnInGuard: step.burnInGuardArg ?? true,
          antiFringing: true,
        })(safeDict)
        break
      case 'auditOledPower':
        current = auditOledPower({ maxAvgPowerMw: 320, maxBlueStress: 65 })(safeDict)
        break
      default: {
        const unknownOp: never = step.op
        throw new Error(`Unknown pipeline operator: ${String(unknownOp)}`)
      }
    }

    snapshots.push({
      stepId: step.id,
      op: step.op,
      enabled: true,
      outputFormatted: formatOutput(current),
    })
  }

  return { snapshots, finalFormatted: formatOutput(current) }
}

function quotedKeys(raw: string): string {
  return splitKeys(raw).map((key) => `'${key}'`).join(', ')
}

export function renderPipelineSource(steps: readonly PipelineStep[]): string {
  const stepLines = steps.filter((step) => step.enabled).map((step) => {
    switch (step.op) {
      case 'pickTokens':
        return `  pickTokens([${quotedKeys(step.keysArg)}])`
      case 'omitTokens':
        return `  omitTokens([${quotedKeys(step.keysArg)}])`
      case 'renameCase':
        return `  renameCase('${step.caseArg}')`
      case 'withPrefix':
        return `  withPrefix('${step.prefixArg}')`
      case 'mapWithAlpha':
        return `  mapTokens(withAlpha(${step.alphaArg}))`
      case 'nestTokens':
        return `  nestTokens('${step.separatorArg || '-'}')`
      case 'toCssRuleBlock':
        return `  toCssRuleBlock('${step.selectorArg || ':root'}')`
      case 'validateContract':
        return `  validateContract([${quotedKeys(step.keysArg)}])`
      case 'optimizeForOled':
        return `  optimizeForOled({ profile: '${step.oledProfileArg || 'amoled-anti-smear'}', burnInGuard: ${step.burnInGuardArg ?? true}, antiFringing: true })`
      case 'auditOledPower':
        return `  auditOledPower({ maxAvgPowerMw: 320, maxBlueStress: 65 })`
      default: {
        const unknownOp: never = step.op
        throw new Error(`Unknown pipeline operator: ${String(unknownOp)}`)
      }
    }
  })
  const body = stepLines.join(',\n')
  return `import { pipe, flow, pickTokens, omitTokens, renameCase, withPrefix, mapTokens, withAlpha, nestTokens, toCssRuleBlock, validateContract, optimizeForOled, auditOledPower } from './color/fp';

// 1. Point-Free 左结合函数组合子 flow(...) — 严格遵循 func(args)(dataLast)
export const transformThemeTokens = flow(
${body}
);

// 2. 立即求值管道 pipe(dataFirst, ...curriedOps)
const result = pipe(
  themeTokens,
${body}
);`
}

export const DefaultPipelineSteps: PipelineStep[] = [
  blankStep({
    id: 'step-1',
    op: 'pickTokens',
    keysArg: 'primary, onPrimary, primaryContainer, surface, error',
    prefixArg: '--okyct-sys',
  }),
  blankStep({ id: 'step-2', op: 'renameCase', prefixArg: '--okyct-sys' }),
  blankStep({ id: 'step-3', op: 'withPrefix', prefixArg: '--okyct-color' }),
  blankStep({ id: 'step-4', op: 'toCssRuleBlock', prefixArg: '--okyct-color' }),
]

export function stepsForPreset(preset: 'css' | 'nested-json' | 'contract' | 'oled'): PipelineStep[] {
  if (preset === 'css') {
    return [
      blankStep({ id: 'p1', op: 'pickTokens', keysArg: 'primary, onPrimary, primaryContainer, surface, error', alphaArg: 0.16 }),
      blankStep({ id: 'p2', op: 'renameCase', alphaArg: 0.16 }),
      blankStep({ id: 'p3', op: 'withPrefix', alphaArg: 0.16 }),
      blankStep({ id: 'p4', op: 'toCssRuleBlock', alphaArg: 0.16 }),
    ]
  }
  if (preset === 'oled') {
    return [
      blankStep({
        id: 'o1',
        op: 'optimizeForOled',
        prefixArg: '--okyct-oled',
        alphaArg: 1,
        selectorArg: '.dark',
        oledProfileArg: 'amoled-anti-smear',
        burnInGuardArg: true,
      }),
      blankStep({ id: 'o2', op: 'renameCase', prefixArg: '--okyct-oled', alphaArg: 1, selectorArg: '.dark' }),
      blankStep({ id: 'o3', op: 'withPrefix', prefixArg: '--okyct-oled', alphaArg: 1, selectorArg: '.dark' }),
      blankStep({ id: 'o4', op: 'toCssRuleBlock', prefixArg: '--okyct-oled', alphaArg: 1, selectorArg: '.dark' }),
    ]
  }
  if (preset === 'nested-json') {
    return [
      blankStep({ id: 'n1', op: 'renameCase', prefixArg: '', alphaArg: 0.8 }),
      blankStep({ id: 'n2', op: 'mapWithAlpha', prefixArg: '', alphaArg: 0.85 }),
      blankStep({ id: 'n3', op: 'nestTokens', prefixArg: '', alphaArg: 0.85 }),
    ]
  }
  return [
    blankStep({ id: 'c1', op: 'omitTokens', keysArg: 'error, success', caseArg: 'camel', prefixArg: '', alphaArg: 1 }),
    blankStep({
      id: 'c2',
      op: 'validateContract',
      keysArg: 'primary, onPrimary, surface, error, outline',
      caseArg: 'camel',
      prefixArg: '',
      alphaArg: 1,
    }),
  ]
}
