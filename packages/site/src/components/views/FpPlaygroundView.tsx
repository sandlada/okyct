
import React, { useState, useMemo } from 'react';
import { DynamicSchemeColors } from '../../color/scheme.ts';
import {
  ColorLayer,
  stackLayers,
  auditStackedContrast,
} from '../../color/stacker.ts';
import {
  withAlpha,
  toCssRuleBlock,
  renameCase,
  withPrefix,
  pickTokens,
  omitTokens,
  mapTokens,
  nestTokens,
  validateContract,
  optimizeForOled,
  auditOledPower,
  TokenDictionary,
  NamingCase,
} from '../../color/fp.ts';
import { EmissivePanelType } from '../../color/emissive.ts';
import {
  Layers,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { useI18n } from '../../i18n/index.tsx'

const EnglishCopy = {
  pageTitle: 'Composition',
  stackerTitle: 'Stack',
  blendLinear: 'Linear',
  blendOkyct: 'OKYCT',
  blendGamma: 'Gamma',
  addLayer: 'Add layer',
  resetOpacity: 'Reset opacity',
  baseLayerLabel: 'Layer 0 (Base)',
  pickBaseColor: 'Choose base color',
  layerPlaceholder: (index: number) => `Layer ${index}`,
  moveUp: 'Move up',
  moveDown: 'Move down',
  removeLayer: 'Remove this layer',
  compositedTitle: (space: string) => `Composited result (${space})`,
  foregroundPreview: (tone: string) => `Foreground text preview (T=${tone})`,
  stackedContrast: (ratio: number) => `Stacked WCAG contrast: ${ratio}:1`,
  passAA: 'AA compliant',
  failAA: 'Below safe threshold',
  toneDrift: (delta: number) => `Base tone drift: ${delta > 0 ? '+' : ''}${delta}`,
  stackWarning: (layers: number, delta: number, ratio: string) =>
    `Warning: after ${layers} stacked layers the background tone shifted by ΔT=${delta > 0 ? '+' : ''}${delta.toFixed(1)}, dropping contrast to ${ratio}:1 (below WCAG AA 4.5:1).`,
  compensation: (tone: number) => `Compensate foreground text tone to T${tone}.`,
  stateComparison: 'Component state comparison',
  baseOnly: 'Base only',
  compositeLayers: (count: number) => `${count}-layer composite`,
  cssMixLabel: 'CSS color-mix expression:',
  traceChain: 'Per-layer stacking chain',
  contrastWithWhite: (ratio: string) => `Contrast with white: ${ratio}:1`,
  pipelineTitle: 'Pipeline',
  presetCss: 'CSS variables',
  presetOled: 'OLED tuning',
  presetAlphaTree: 'Alpha tree',
  presetContract: 'Contract assertion',
  addOperator: 'Add operator',
  toggleOperator: 'Enable or bypass this operator',
  inspectSnapshot: 'Inspect the intermediate output snapshot after this step',
  inspecting: 'Inspecting',
  snapshot: 'Snapshot',
  stepSnapshot: (index: number) => `Step #${index} snapshot`,
  evalOutput: 'Evaluation output',
  tsSource: 'TS source (pipe)',
  backToFinal: 'Back to final output',
  copied: 'Copied',
  copyContent: 'Copy content',
  hoverLayer: 'Hover state glow layer',
  focusLayer: 'Focus state highlight layer',
  pressedLayer: 'Pressed state darkening layer',
  customLayer: (index: number) => `Custom layer ${index}`,
  previewButton: 'Button',
  stackModes: {
    rest: 'Default',
    hover: 'Hover',
    pressed: 'Pressed',
    hoverPressed: 'Hover + Pressed',
    focused: 'Focused',
    hoverFocused: 'Hover + Focused',
    pressedFocused: 'Pressed + Focused',
    hoverPressedFocused: 'Hover + Pressed + Focused',
  },
  operatorLabels: {
    pickTokens: 'Pick subset',
    omitTokens: 'Omit keys',
    renameCase: 'Rename case style',
    withPrefix: 'Namespace prefix',
    mapWithAlpha: 'Batch inject alpha',
    nestTokens: 'Nest as JSON tree',
    toCssRuleBlock: 'CSS rule block',
    validateContract: 'Contract assertion',
    optimizeForOled: 'OLED tuning',
    auditOledPower: 'Power audit',
  },
}

const TraditionalCopy: typeof EnglishCopy = {
  pageTitle: '組合',
  stackerTitle: '疊加',
  blendLinear: 'Linear',
  blendOkyct: 'OKYCT',
  blendGamma: 'Gamma',
  addLayer: '新增圖層',
  resetOpacity: '重設透明度',
  baseLayerLabel: 'Layer 0（基底底色）',
  pickBaseColor: '選擇底色',
  layerPlaceholder: (index: number) => `Layer ${index}`,
  moveUp: '上移',
  moveDown: '下移',
  removeLayer: '刪除此圖層',
  compositedTitle: (space: string) => `N 層最終合成結果（${space}）`,
  foregroundPreview: (tone: string) => `前景文字預覽（T=${tone}）`,
  stackedContrast: (ratio: number) => `疊加態 WCAG 對比度：${ratio}:1`,
  passAA: 'AA 合規',
  failAA: '跌破安全閾值',
  toneDrift: (delta: number) => `底色 Tone 漂移量：${delta > 0 ? '+' : ''}${delta}`,
  stackWarning: (layers: number, delta: number, ratio: string) =>
    `警告：在 ${layers} 層疊加後，背景 Tone 產生 ΔT=${delta > 0 ? '+' : ''}${delta.toFixed(1)} 偏移，導致對比度跌至 ${ratio}:1（低於 WCAG AA 4.5:1）。`,
  compensation: (tone: number) => `建議將前景文字 Tone 補償至 T${tone}。`,
  stateComparison: '元件狀態對比',
  baseOnly: '未疊加',
  compositeLayers: (count: number) => `${count} 層複合態`,
  cssMixLabel: 'CSS color-mix 表達式：',
  traceChain: '逐層疊加鏈路',
  contrastWithWhite: (ratio: string) => `對白字對比度：${ratio}:1`,
  pipelineTitle: '管線',
  presetCss: 'CSS 變數',
  presetOled: 'OLED 調校',
  presetAlphaTree: 'Alpha 樹',
  presetContract: '契約斷言',
  addOperator: '追加算子',
  toggleOperator: '啟用／旁路該算子',
  inspectSnapshot: '檢視此步執行後的中間輸出快照',
  inspecting: '檢視中',
  snapshot: '快照',
  stepSnapshot: (index: number) => `步驟 #${index} 快照`,
  evalOutput: '求值輸出',
  tsSource: 'TS 原始碼（pipe）',
  backToFinal: '返回最終輸出',
  copied: '已複製',
  copyContent: '複製內容',
  hoverLayer: 'Hover 態光暈層',
  focusLayer: 'Focus 態高亮層',
  pressedLayer: 'Pressed 深度暗化層',
  customLayer: (index: number) => `自訂圖層 ${index}`,
  previewButton: '按鈕',
  stackModes: {
    rest: '預設',
    hover: '懸停',
    pressed: '按下',
    hoverPressed: '懸停 + 按下',
    focused: '聚焦',
    hoverFocused: '懸停 + 聚焦',
    pressedFocused: '按下 + 聚焦',
    hoverPressedFocused: '懸停 + 按下 + 聚焦',
  },
  operatorLabels: {
    pickTokens: '挑選子集',
    omitTokens: '剔除鍵名',
    renameCase: '命名風格轉換',
    withPrefix: '命名空間前綴',
    mapWithAlpha: '批次注入 Alpha',
    nestTokens: '轉樹狀 JSON',
    toCssRuleBlock: 'CSS 規則區塊',
    validateContract: '契約斷言',
    optimizeForOled: 'OLED 調校',
    auditOledPower: '功耗審計',
  },
}

const CopyByLocale = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

interface FpPlaygroundViewProps {
  scheme: DynamicSchemeColors;
  isDark: boolean;
}

type OperatorKind =
  | 'pickTokens'
  | 'omitTokens'
  | 'renameCase'
  | 'withPrefix'
  | 'mapWithAlpha'
  | 'optimizeForOled'
  | 'auditOledPower'
  | 'nestTokens'
  | 'toCssRuleBlock'
  | 'validateContract';

interface PipelineStep {
  id: string;
  op: OperatorKind;
  enabled: boolean;
  keysArg: string;
  caseArg: NamingCase;
  prefixArg: string;
  alphaArg: number;
  selectorArg: string;
  separatorArg: string;
  oledProfileArg?: EmissivePanelType;
  burnInGuardArg?: boolean;
}

const OPERATOR_META: Record<
  OperatorKind,
  {
    signature: string;
  }
> = {
  pickTokens: {
    signature: 'pickTokens(keys)',
  },
  omitTokens: {
    signature: 'omitTokens(keys)',
  },
  renameCase: {
    signature: 'renameCase(case)',
  },
  withPrefix: {
    signature: 'withPrefix(prefix)',
  },
  mapWithAlpha: {
    signature: 'mapWithAlpha(α)',
  },
  nestTokens: {
    signature: 'nestTokens(sep)',
  },
  toCssRuleBlock: {
    signature: 'toCssRuleBlock(sel)',
  },
  validateContract: {
    signature: 'validateContract(keys)',
  },
  optimizeForOled: {
    signature: 'optimizeForOled(opts)',
  },
  auditOledPower: {
    signature: 'auditOledPower(opts)',
  },
};

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

type StackLayerRole = 'hover' | 'focus' | 'pressed' | 'custom'
type StackLayer = ColorLayer & { defaultOpacity: number; role: StackLayerRole }

export const FpPlaygroundView: React.FC<FpPlaygroundViewProps> = ({ scheme }) => {
  const { locale } = useI18n()
  const copy = CopyByLocale[locale]

  // -------------------------------------------------------------
  // 1. N 层颜色叠加器状态 (支持 Linear sRGB / OKYCT Perceptual / Gamma sRGB)
  // -------------------------------------------------------------
  const [baseColor, setBaseColor] = useState<string>(scheme.primary);
  const [foregroundText, setForegroundText] = useState<string>(scheme.onPrimary);
  const [blendSpace, setBlendSpace] = useState<'linear-srgb' | 'okyct' | 'gamma-srgb'>('linear-srgb');

  const createDefaultLayers = (): StackLayer[] => [
    { color: '#FFFFFF', opacity: 0.08, defaultOpacity: 0.08, role: 'hover', label: copy.hoverLayer },
    { color: '#FFFFFF', opacity: 0.12, defaultOpacity: 0.12, role: 'focus', label: copy.focusLayer },
    { color: '#000000', opacity: 0.10, defaultOpacity: 0.10, role: 'pressed', label: copy.pressedLayer },
  ]

  const [layers, setLayers] = useState<StackLayer[]>(createDefaultLayers);

  React.useEffect(() => {
    setBaseColor(scheme.primary);
    setForegroundText(scheme.onPrimary);
  }, [scheme.primary, scheme.onPrimary]);

  const statePreviews = useMemo(() => {
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
  }, [layers, baseColor, blendSpace, foregroundText])

  const previewHex = Object.fromEntries(statePreviews.map((preview) => [preview.id, preview.hex])) as Record<
    (typeof statePreviews)[number]['id'],
    string
  >

  const handleAddLayer = () => {
    const nextIdx = layers.length + 1;
    setLayers([
      ...layers,
      {
        color: scheme.tertiary,
        opacity: 0.15,
        defaultOpacity: 0.15,
        role: 'custom',
        label: copy.customLayer(nextIdx),
      },
    ]);
  };

  const handleRemoveLayer = (idx: number) => {
    setLayers(layers.filter((_, i) => i !== idx));
  };

  const handleUpdateLayer = (idx: number, patch: Partial<ColorLayer>) => {
    setLayers(layers.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const handleMoveLayer = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx > 0) {
      const next = [...layers];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      setLayers(next);
    } else if (direction === 'down' && idx < layers.length - 1) {
      const next = [...layers];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      setLayers(next);
    }
  };

  // -------------------------------------------------------------
  // 2. 真实交互式 func(args)(dataLast) 函数管道编排器状态
  // -------------------------------------------------------------
  const [steps, setSteps] = useState<PipelineStep[]>([
    {
      id: 'step-1',
      op: 'pickTokens',
      enabled: true,
      keysArg: 'primary, onPrimary, primaryContainer, surface, error',
      caseArg: 'kebab',
      prefixArg: '--okyct-sys',
      alphaArg: 0.85,
      selectorArg: ':root',
      separatorArg: '-',
    },
    {
      id: 'step-2',
      op: 'renameCase',
      enabled: true,
      keysArg: '',
      caseArg: 'kebab',
      prefixArg: '--okyct-sys',
      alphaArg: 0.85,
      selectorArg: ':root',
      separatorArg: '-',
    },
    {
      id: 'step-3',
      op: 'withPrefix',
      enabled: true,
      keysArg: '',
      caseArg: 'kebab',
      prefixArg: '--okyct-color',
      alphaArg: 0.85,
      selectorArg: ':root',
      separatorArg: '-',
    },
    {
      id: 'step-4',
      op: 'toCssRuleBlock',
      enabled: true,
      keysArg: '',
      caseArg: 'kebab',
      prefixArg: '--okyct-color',
      alphaArg: 0.85,
      selectorArg: ':root',
      separatorArg: '-',
    },
  ]);

  const [newOpType, setNewOpType] = useState<OperatorKind>('mapWithAlpha');
  const [inspectStepIdx, setInspectStepIdx] = useState<number | null>(null);
  const [codeTab, setCodeTab] = useState<'output' | 'ts-code'>('output');
  const [copiedCode, setCopiedCode] = useState(false);

  // 初始数据源字典 (Data-Last 最终喂入的数据)
  const initialTokenDict: TokenDictionary = useMemo(
    () => ({
      primary: scheme.primary,
      onPrimary: scheme.onPrimary,
      primaryContainer: scheme.primaryContainer,
      onPrimaryContainer: scheme.onPrimaryContainer,
      secondary: scheme.secondary,
      tertiary: scheme.tertiary,
      surface: scheme.surface,
      onSurface: scheme.onSurface,
      error: scheme.error,
      success: scheme.success,
    }),
    [scheme]
  );

  // 逐步执行算子管线并记录每一步快照
  const pipelineExecution = useMemo(() => {
    const snapshots: Array<{
      stepId: string;
      op: OperatorKind;
      enabled: boolean;
      output: unknown;
      outputFormatted: string;
    }> = [];

    let currentData: any = initialTokenDict;

    for (const step of steps) {
      if (!step.enabled) {
        snapshots.push({
          stepId: step.id,
          op: step.op,
          enabled: false,
          output: currentData,
          outputFormatted:
            typeof currentData === 'string'
              ? currentData
              : JSON.stringify(currentData, null, 2),
        });
        continue;
      }

      // 如果上一步已经变成非普通字典（如字符串或校验报告），自动将字典重置为最后一次有效字典或原字典以保证流水线稳定
      const safeDict: TokenDictionary =
        typeof currentData === 'object' &&
        currentData !== null &&
        !('valid' in currentData)
          ? (currentData as TokenDictionary)
          : initialTokenDict;

      switch (step.op) {
        case 'pickTokens': {
          const keys = step.keysArg
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean);
          currentData = pickTokens(keys)(safeDict);
          break;
        }
        case 'omitTokens': {
          const keys = step.keysArg
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean);
          currentData = omitTokens(keys)(safeDict);
          break;
        }
        case 'renameCase': {
          currentData = renameCase(step.caseArg)(safeDict);
          break;
        }
        case 'withPrefix': {
          currentData = withPrefix(step.prefixArg)(safeDict);
          break;
        }
        case 'mapWithAlpha': {
          const alphaOp = withAlpha(step.alphaArg);
          currentData = mapTokens((val) => alphaOp(val))(safeDict);
          break;
        }
        case 'nestTokens': {
          currentData = nestTokens(step.separatorArg || '-')(safeDict);
          break;
        }
        case 'toCssRuleBlock': {
          currentData = toCssRuleBlock(step.selectorArg || ':root')(safeDict);
          break;
        }
        case 'validateContract': {
          const reqKeys = step.keysArg
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean);
          currentData = validateContract(reqKeys)(safeDict);
          break;
        }
        case 'optimizeForOled': {
          currentData = optimizeForOled({
            profile: step.oledProfileArg || 'amoled-anti-smear',
            burnInGuard: step.burnInGuardArg ?? true,
            antiFringing: true,
          })(safeDict);
          break;
        }
        case 'auditOledPower': {
          currentData = auditOledPower({ maxAvgPowerMw: 320, maxBlueStress: 65 })(safeDict);
          break;
        }
      }

      snapshots.push({
        stepId: step.id,
        op: step.op,
        enabled: true,
        output: currentData,
        outputFormatted:
          typeof currentData === 'string'
            ? currentData
            : JSON.stringify(currentData, null, 2),
      });
    }

    const finalFormatted =
      typeof currentData === 'string'
        ? currentData
        : JSON.stringify(currentData, null, 2);

    return { snapshots, finalFormatted };
  }, [steps, initialTokenDict]);

  // 自动生成当前管线等价的 TypeScript pipe / flow 源码
  const generatedTsCode = useMemo(() => {
    const activeSteps = steps.filter((s) => s.enabled);
    const stepLines = activeSteps.map((s) => {
      switch (s.op) {
        case 'pickTokens': {
          const keys = s.keysArg
            .split(',')
            .map((k) => `'${k.trim()}'`)
            .filter((k) => k !== "''")
            .join(', ');
          return `  pickTokens([${keys}])`;
        }
        case 'omitTokens': {
          const keys = s.keysArg
            .split(',')
            .map((k) => `'${k.trim()}'`)
            .filter((k) => k !== "''")
            .join(', ');
          return `  omitTokens([${keys}])`;
        }
        case 'renameCase':
          return `  renameCase('${s.caseArg}')`;
        case 'withPrefix':
          return `  withPrefix('${s.prefixArg}')`;
        case 'mapWithAlpha':
          return `  mapTokens(withAlpha(${s.alphaArg}))`;
        case 'nestTokens':
          return `  nestTokens('${s.separatorArg || '-'}')`;
        case 'toCssRuleBlock':
          return `  toCssRuleBlock('${s.selectorArg || ':root'}')`;
        case 'validateContract': {
          const keys = s.keysArg
            .split(',')
            .map((k) => `'${k.trim()}'`)
            .filter((k) => k !== "''")
            .join(', ');
          return `  validateContract([${keys}])`;
        }
        case 'optimizeForOled':
          return `  optimizeForOled({ profile: '${s.oledProfileArg || 'amoled-anti-smear'}', burnInGuard: ${s.burnInGuardArg ?? true}, antiFringing: true })`;
        case 'auditOledPower':
          return `  auditOledPower({ maxAvgPowerMw: 320, maxBlueStress: 65 })`;
      }
    });

    return `import { pipe, flow, pickTokens, omitTokens, renameCase, withPrefix, mapTokens, withAlpha, nestTokens, toCssRuleBlock, validateContract, optimizeForOled, auditOledPower } from './color/fp';

// 1. Point-Free 左结合函数组合子 flow(...) — 严格遵循 func(args)(dataLast)
export const transformThemeTokens = flow(
${stepLines.join(',\n')}
);

// 2. 立即求值管道 pipe(dataFirst, ...curriedOps)
const result = pipe(
  themeTokens,
${stepLines.join(',\n')}
);`;
  }, [steps]);

  const handleAddStep = () => {
    const nextStep: PipelineStep = {
      id: `step-${Date.now()}`,
      op: newOpType,
      enabled: true,
      keysArg:
        newOpType === 'validateContract'
          ? 'primary, onPrimary, surface, outline'
          : 'primary, onPrimary, surface',
      caseArg: 'kebab',
      prefixArg: '--okyct-token',
      alphaArg: 0.24,
      selectorArg: ':root',
      separatorArg: '-',
    };
    setSteps([...steps, nextStep]);
  };

  const handleUpdateStep = (idx: number, patch: Partial<PipelineStep>) => {
    setSteps(steps.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const handleRemoveStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx));
    if (inspectStepIdx === idx) setInspectStepIdx(null);
  };

  const handleMoveStep = (idx: number, dir: 'up' | 'down') => {
    if (dir === 'up' && idx > 0) {
      const next = [...steps];
      const tmp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = tmp;
      setSteps(next);
    } else if (dir === 'down' && idx < steps.length - 1) {
      const next = [...steps];
      const tmp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = tmp;
      setSteps(next);
    }
  };

  const loadPresetPipeline = (preset: 'css' | 'nested-json' | 'contract' | 'oled') => {
    setInspectStepIdx(null);
    if (preset === 'css') {
      setSteps([
        {
          id: 'p1',
          op: 'pickTokens',
          enabled: true,
          keysArg: 'primary, onPrimary, primaryContainer, surface, error',
          caseArg: 'kebab',
          prefixArg: '--okyct-color',
          alphaArg: 0.16,
          selectorArg: ':root',
          separatorArg: '-',
        },
        {
          id: 'p2',
          op: 'renameCase',
          enabled: true,
          keysArg: '',
          caseArg: 'kebab',
          prefixArg: '--okyct-color',
          alphaArg: 0.16,
          selectorArg: ':root',
          separatorArg: '-',
        },
        {
          id: 'p3',
          op: 'withPrefix',
          enabled: true,
          keysArg: '',
          caseArg: 'kebab',
          prefixArg: '--okyct-color',
          alphaArg: 0.16,
          selectorArg: ':root',
          separatorArg: '-',
        },
        {
          id: 'p4',
          op: 'toCssRuleBlock',
          enabled: true,
          keysArg: '',
          caseArg: 'kebab',
          prefixArg: '--okyct-color',
          alphaArg: 0.16,
          selectorArg: ':root',
          separatorArg: '-',
        },
      ]);
    } else if (preset === 'oled') {
      setSteps([
        {
          id: 'o1',
          op: 'optimizeForOled',
          enabled: true,
          keysArg: '',
          caseArg: 'kebab',
          prefixArg: '--okyct-oled',
          alphaArg: 1,
          selectorArg: '.dark',
          separatorArg: '-',
          oledProfileArg: 'amoled-anti-smear',
          burnInGuardArg: true,
        },
        {
          id: 'o2',
          op: 'renameCase',
          enabled: true,
          keysArg: '',
          caseArg: 'kebab',
          prefixArg: '--okyct-oled',
          alphaArg: 1,
          selectorArg: '.dark',
          separatorArg: '-',
        },
        {
          id: 'o3',
          op: 'withPrefix',
          enabled: true,
          keysArg: '',
          caseArg: 'kebab',
          prefixArg: '--okyct-oled',
          alphaArg: 1,
          selectorArg: '.dark',
          separatorArg: '-',
        },
        {
          id: 'o4',
          op: 'toCssRuleBlock',
          enabled: true,
          keysArg: '',
          caseArg: 'kebab',
          prefixArg: '--okyct-oled',
          alphaArg: 1,
          selectorArg: '.dark',
          separatorArg: '-',
        },
      ]);
    } else if (preset === 'nested-json') {
      setSteps([
        {
          id: 'n1',
          op: 'renameCase',
          enabled: true,
          keysArg: '',
          caseArg: 'kebab',
          prefixArg: '',
          alphaArg: 0.8,
          selectorArg: ':root',
          separatorArg: '-',
        },
        {
          id: 'n2',
          op: 'mapWithAlpha',
          enabled: true,
          keysArg: '',
          caseArg: 'kebab',
          prefixArg: '',
          alphaArg: 0.85,
          selectorArg: ':root',
          separatorArg: '-',
        },
        {
          id: 'n3',
          op: 'nestTokens',
          enabled: true,
          keysArg: '',
          caseArg: 'kebab',
          prefixArg: '',
          alphaArg: 0.85,
          selectorArg: ':root',
          separatorArg: '-',
        },
      ]);
    } else {
      setSteps([
        {
          id: 'c1',
          op: 'omitTokens',
          enabled: true,
          keysArg: 'error, success',
          caseArg: 'camel',
          prefixArg: '',
          alphaArg: 1,
          selectorArg: ':root',
          separatorArg: '-',
        },
        {
          id: 'c2',
          op: 'validateContract',
          enabled: true,
          keysArg: 'primary, onPrimary, surface, error, outline',
          caseArg: 'camel',
          prefixArg: '',
          alphaArg: 1,
          selectorArg: ':root',
          separatorArg: '-',
        },
      ]);
    }
  };

  const displayedOutput =
    inspectStepIdx !== null && pipelineExecution.snapshots[inspectStepIdx]
      ? pipelineExecution.snapshots[inspectStepIdx].outputFormatted
      : pipelineExecution.finalFormatted;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-6 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6 max-w-[1600px] mx-auto w-full">
      <h2 className="text-sm sm:text-base font-bold font-display tracking-tight flex items-center gap-2">
        <Layers className="w-4 h-4 text-neutral-500 shrink-0" />
        {copy.pageTitle}
      </h2>

      {/* ============================================================= */}
      {/* 1. N 层颜色叠加可视化合成器 (N-Layer Interactive Stacker) */}
      {/* ============================================================= */}
      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold tracking-tight">
            {copy.stackerTitle}
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            {/* 混合色彩空间三档切换 */}
            <div className="flex items-center gap-1 p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-mono">
              <button
                onClick={() => setBlendSpace('linear-srgb')}
                className={`px-2 py-1 rounded transition-colors ${
                  blendSpace === 'linear-srgb'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs font-bold'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {copy.blendLinear}
              </button>
              <button
                onClick={() => setBlendSpace('okyct')}
                className={`px-2 py-1 rounded transition-colors ${
                  blendSpace === 'okyct'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs font-bold'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {copy.blendOkyct}
              </button>
              <button
                onClick={() => setBlendSpace('gamma-srgb')}
                className={`px-2 py-1 rounded transition-colors ${
                  blendSpace === 'gamma-srgb'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs font-bold'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {copy.blendGamma}
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddLayer}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{copy.addLayer}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
          {statePreviews.map((preview) => (
            <div
              key={preview.id}
              className="rounded-md border border-black/10 px-2 py-1 flex flex-col"
              style={{ backgroundColor: preview.hex, color: foregroundText }}
            >
              <span className="text-[11px] font-medium leading-tight">{copy.stackModes[preview.id]}</span>
              <span className="font-mono text-[10px] leading-tight opacity-80">
                {`${preview.hex} · ${preview.ratio.toFixed(2)}:1`}
              </span>
            </div>
          ))}
        </div>

        <style>
          {`
            .okyct-acted-button { background-color: ${previewHex.rest}; color: ${foregroundText}; }
            .okyct-acted-button:hover { background-color: ${previewHex.hover}; }
            .okyct-acted-button:active { background-color: ${previewHex.pressed}; }
            .okyct-acted-button:focus-visible { background-color: ${previewHex.focused}; }
            .okyct-acted-button:hover:active { background-color: ${previewHex.hoverPressed}; }
            .okyct-acted-button:hover:focus-visible { background-color: ${previewHex.hoverFocused}; }
            .okyct-acted-button:active:focus-visible { background-color: ${previewHex.pressedFocused}; }
            .okyct-acted-button:hover:active:focus-visible { background-color: ${previewHex.hoverPressedFocused}; }
          `}
        </style>
        <button type="button" className="okyct-acted-button w-fit px-3 py-1 text-xs font-semibold rounded-lg border border-black/10 outline-none">
          {copy.previewButton}
        </button>

        <div className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2.5 bg-neutral-50/80 dark:bg-neutral-800/40">
              <input
                type="color"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                className="w-7 h-7 rounded-md border border-black/10 cursor-pointer p-0 bg-transparent shrink-0"
                title={copy.pickBaseColor}
              />
              <span className="text-xs font-medium flex-1 min-w-0">{copy.baseLayerLabel}</span>
              <span className="text-[11px] font-mono text-neutral-500 tabular-nums">100%</span>
            </div>

            {/* Layer 1..N: 可调透明度与颜色叠加层 */}
            {layers.map((layer, idx) => (
              <div key={idx} className="flex items-center gap-2 sm:gap-3 px-3 py-2">
                <input
                  type="color"
                  value={layer.color}
                  onChange={(e) => handleUpdateLayer(idx, { color: e.target.value })}
                  className="w-7 h-7 rounded-md border border-black/10 cursor-pointer p-0 bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={layer.label || ''}
                  onChange={(e) => handleUpdateLayer(idx, { label: e.target.value })}
                  className="text-xs bg-transparent border-0 outline-none min-w-0 flex-1 truncate text-neutral-800 dark:text-neutral-200"
                  placeholder={copy.layerPlaceholder(idx + 1)}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={layer.opacity}
                  onChange={(e) => handleUpdateLayer(idx, { opacity: parseFloat(e.target.value) })}
                  className="w-28 sm:w-40 accent-neutral-900 dark:accent-neutral-100 cursor-pointer shrink-0"
                />
                <span className="text-[11px] font-mono w-9 text-right tabular-nums text-neutral-500">
                  {Math.round(layer.opacity * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdateLayer(idx, { opacity: layer.defaultOpacity })}
                  disabled={Math.abs(layer.opacity - layer.defaultOpacity) < 0.005}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20"
                  title={copy.resetOpacity}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveLayer(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20"
                  title={copy.moveUp}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveLayer(idx, 'down')}
                  disabled={idx === layers.length - 1}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20"
                  title={copy.moveDown}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveLayer(idx)}
                  className="p-1 text-rose-500 hover:text-rose-700"
                  title={copy.removeLayer}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
      </section>

      {/* 2. 函数管道编排器 */}
      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold tracking-tight">{copy.pipelineTitle}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => loadPresetPipeline('css')}
              className="px-2 py-0.5 text-xs font-medium rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {copy.presetCss}
            </button>
            <button
              onClick={() => loadPresetPipeline('oled')}
              className="px-2 py-0.5 text-xs font-medium rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {copy.presetOled}
            </button>
            <button
              onClick={() => loadPresetPipeline('nested-json')}
              className="px-2 py-0.5 text-xs font-medium rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {copy.presetAlphaTree}
            </button>
            <button
              onClick={() => loadPresetPipeline('contract')}
              className="px-2 py-0.5 text-xs font-medium rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {copy.presetContract}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] gap-5 items-start">
          <div className="flex flex-col gap-3 min-w-0">
            {/* 新增算子工具栏 */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800">
              <select
                value={newOpType}
                onChange={(e) => setNewOpType(e.target.value as OperatorKind)}
                className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              >
                {(Object.keys(OPERATOR_META) as OperatorKind[]).map((opKey) => (
                  <option key={opKey} value={opKey}>
                    {copy.operatorLabels[opKey]}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddStep}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{copy.addOperator}</span>
              </button>
            </div>

            {/* 算子步骤卡片列表 */}
            <div className="flex flex-col gap-2.5">
              {steps.map((step, idx) => {
                const isInspected = inspectStepIdx === idx;
                return (
                  <div
                    key={step.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 ${
                      !step.enabled
                        ? 'opacity-50 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-900/40'
                        : isInspected
                        ? 'border-blue-600 dark:border-blue-400 bg-blue-50/20 dark:bg-blue-950/20 ring-1 ring-blue-500/40'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={step.enabled}
                        onChange={(e) => handleUpdateStep(idx, { enabled: e.target.checked })}
                        className="mt-0.5 w-3.5 h-3.5 shrink-0 accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
                        title={copy.toggleOperator}
                      />
                      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-1 min-w-0">
                        <span className="text-[11px] font-mono text-neutral-400 tabular-nums shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-medium truncate">
                          {copy.operatorLabels[step.op]}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setInspectStepIdx(isInspected ? null : idx)}
                          className={`p-1 rounded border transition-colors ${
                            isInspected
                              ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white'
                              : 'border-transparent text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                          }`}
                          title={isInspected ? copy.inspecting : copy.inspectSnapshot}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveStep(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveStep(idx, 'down')}
                          disabled={idx === steps.length - 1}
                          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveStep(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      {(step.op === 'pickTokens' ||
                        step.op === 'omitTokens' ||
                        step.op === 'validateContract') && (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={step.keysArg}
                            onChange={(e) => handleUpdateStep(idx, { keysArg: e.target.value })}
                            className="flex-1 px-2.5 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                            placeholder="primary, onPrimary, surface"
                          />
                        </div>
                      )}

                      {step.op === 'renameCase' && (
                        <div className="flex items-center gap-2">
                          {(['kebab', 'camel', 'snake', 'constant'] as NamingCase[]).map(
                            (cMode) => (
                              <button
                                key={cMode}
                                onClick={() => handleUpdateStep(idx, { caseArg: cMode })}
                                className={`px-2 py-0.5 rounded text-[11px] border ${
                                  step.caseArg === cMode
                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-bold'
                                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-500'
                                }`}
                              >
                                {cMode}
                              </button>
                            )
                          )}
                        </div>
                      )}

                      {step.op === 'withPrefix' && (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={step.prefixArg}
                            onChange={(e) => handleUpdateStep(idx, { prefixArg: e.target.value })}
                            className="flex-1 px-2.5 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                            placeholder="--okyct-color"
                          />
                        </div>
                      )}

                      {step.op === 'mapWithAlpha' && (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="range"
                            min="0.05"
                            max="1"
                            step="0.05"
                            value={step.alphaArg}
                            onChange={(e) =>
                              handleUpdateStep(idx, { alphaArg: parseFloat(e.target.value) })
                            }
                            className="flex-1 accent-neutral-900 dark:accent-neutral-100"
                          />
                          <span className="text-[11px] w-12 text-right tabular-nums">
                            {step.alphaArg.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {step.op === 'nestTokens' && (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={step.separatorArg}
                            onChange={(e) =>
                              handleUpdateStep(idx, { separatorArg: e.target.value })
                            }
                            className="w-24 px-2.5 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                          />
                        </div>
                      )}

                      {step.op === 'toCssRuleBlock' && (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={step.selectorArg}
                            onChange={(e) =>
                              handleUpdateStep(idx, { selectorArg: e.target.value })
                            }
                            className="flex-1 px-2.5 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                            placeholder=":root"
                          />
                        </div>
                      )}

                      {step.op === 'optimizeForOled' && (
                        <div className="flex flex-wrap items-center gap-2 w-full">
                          <select
                            value={step.oledProfileArg || 'amoled-anti-smear'}
                            onChange={(e) =>
                              handleUpdateStep(idx, {
                                oledProfileArg: e.target.value as EmissivePanelType,
                              })
                            }
                            className="px-2 py-0.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                          >
                            <option value="oled-true-black">oled-true-black (T=0)</option>
                            <option value="amoled-anti-smear">amoled-anti-smear (T=4)</option>
                            <option value="micro-oled-xr">micro-oled-xr (T=8)</option>
                          </select>
                          <label className="flex items-center gap-1 text-[11px] cursor-pointer ml-2">
                            <input
                              type="checkbox"
                              checked={step.burnInGuardArg ?? true}
                              onChange={(e) =>
                                handleUpdateStep(idx, { burnInGuardArg: e.target.checked })
                              }
                            />
                            <span>burnInGuard</span>
                          </label>
                        </div>
                      )}
                    </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧：实时求值结果与生成的 pipe/flow 代码视图 */}
          <div className="flex flex-col gap-3 min-w-0 lg:sticky lg:top-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setCodeTab('output')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                    codeTab === 'output'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <span>
                    {inspectStepIdx !== null
                      ? copy.stepSnapshot(inspectStepIdx + 1)
                      : copy.evalOutput}
                  </span>
                </button>
                <button
                  onClick={() => setCodeTab('ts-code')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                    codeTab === 'ts-code'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <span>{copy.tsSource}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {inspectStepIdx !== null && (
                  <button
                    onClick={() => setInspectStepIdx(null)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {copy.backToFinal}
                  </button>
                )}
                <button
                  onClick={() =>
                    handleCopy(codeTab === 'output' ? displayedOutput : generatedTsCode)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedCode ? copy.copied : copy.copyContent}</span>
                </button>
              </div>
            </div>

            <div className="relative flex-1 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-neutral-100 p-4 font-mono text-xs min-h-[320px] max-h-[460px] overflow-y-auto">
              <pre className="whitespace-pre-wrap break-all leading-relaxed">
                {codeTab === 'output' ? displayedOutput : generatedTsCode}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
