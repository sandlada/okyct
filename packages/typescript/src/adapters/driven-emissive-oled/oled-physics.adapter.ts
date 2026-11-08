/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer 4: Driven Adapter — Emissive OLED / AMOLED / MicroOLED Physics]
 * 实现 IDisplayPhysicsPort 契约：
 * 1. OLED 纯黑断电省电 (T=0) vs AMOLED 120Hz 子像素电容起辉黑拖影 (Black Smearing)
 * 2. 蓝色有机发光材料 (Blue Emitter) 低内量子效率功耗模型与差异化烧屏守卫
 * 3. AMOLED Diamond PenTile 子像素彩边抑制与 MicroOLED Pancake 近眼防眩光
 */

import {
  hexToRgb,
  srgbToLinear,
  hexToOkyct,
  okyctToHex,
  getContrastRatio,
} from '../../domain/index.ts';
import type {
  DynamicSchemeColors,
  EmissivePanelType,
  SubpixelGeometry,
  EmissivePanelSpec,
  EmissiveSchemeOptions,
  ColorEmissiveTelemetry,
  SchemeEmissiveReport,
  IDisplayPhysicsPort,
} from '../../ports/index.ts';
import {
  buildDynamicSchemeWithPhysics,
  type PaletteSet,
} from '../../application/index.ts';

export type {
  EmissivePanelType,
  SubpixelGeometry,
  EmissivePanelSpec,
  EmissiveSchemeOptions,
  ColorEmissiveTelemetry,
  SchemeEmissiveReport,
};

export const EMISSIVE_PANEL_SPECS: Record<EmissivePanelType, EmissivePanelSpec> = {
  'standard-lcd': {
    id: 'standard-lcd',
    name: 'Standard IPS / Mini-LED LCD',
    shortName: 'LCD 标准参照',
    badge: '全局背光',
    subpixelGeometry: 'rgb-stripe',
    geometryLabel: 'RGB Stripe (标准三色竖条排列)',
    description: '依靠恒定背光层透过液晶分子偏转显色，功耗几乎与画面色彩/明暗无关，无子像素断电与烧屏现象。',
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
    name: 'OLED True-Black (纯黑极限省电)',
    shortName: 'OLED 纯黑省电',
    badge: 'T=0 零功耗关断',
    subpixelGeometry: 'rgb-stripe',
    geometryLabel: 'RGB OLED (独立自发光像素)',
    description: '将底层背景压至纯黑 #000000 (T=0) 使有机发光二极管完全断电，最大化像素关断率与静态续航，但从 T=0 唤醒至低灰阶存在 18ms 电容充电黑拖影。',
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
    name: 'AMOLED 120Hz Anti-Smear (防黑拖影起辉)',
    shortName: 'AMOLED 防拖影',
    badge: 'T=4 预偏置起辉',
    subpixelGeometry: 'diamond-pentile',
    geometryLabel: 'Diamond PenTile (绿多红蓝减半菱形借用)',
    description: '专为 120Hz 移动端高刷屏幕调校：将最暗表面锚定在子像素起辉电位 T=4 (#0B0B0E)，保持微弱导通，彻底消除滚动果冻黑拖影与紫边，并抑制 PenTile 彩边。',
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
    name: 'MicroOLED Silicon XR (硅基微显示低眩光)',
    shortName: 'MicroOLED XR',
    badge: '防光晕 + 抗 ABL',
    subpixelGeometry: 'micro-oled-hex',
    geometryLabel: 'Silicon Tandem Micro-Cavity (硅基微腔密排)',
    description: '面向 XR 头显与硅基微显示：将暗底抬升至 T=8 丝绒灰并将峰值白光柔和收敛至 T=92，消除 Pancake 透镜内反射光晕 (Halation) 并防止触发硅基驱动背板 ABL 骤暗。',
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
};

const WEIGHT_R = 1.45;
const WEIGHT_G = 1.00;
const WEIGHT_B = 2.40;
const WEIGHT_SUM = WEIGHT_R + WEIGHT_G + WEIGHT_B;
const FULL_WHITE_OLED_MW = 820;
const BACKPLANE_STATIC_MW = 95;
const LCD_CONSTANT_BACKLIGHT_MW = 540;

/**
 * 计算单个颜色的子像素光谱功耗、APL 贡献与蓝光烧屏应力
 */
export function computeColorEmissiveTelemetry(hex: string): ColorEmissiveTelemetry {
  const rgb = hexToRgb(hex);
  const rLin = srgbToLinear(rgb.r);
  const gLin = srgbToLinear(rgb.g);
  const bLin = srgbToLinear(rgb.b);

  const isPixelOff = rLin < 0.0005 && gLin < 0.0005 && bLin < 0.0005;

  const gammaDrive = 1.08;
  const rDrive = isPixelOff ? 0 : Math.pow(rLin, gammaDrive);
  const gDrive = isPixelOff ? 0 : Math.pow(gLin, gammaDrive);
  const bDrive = isPixelOff ? 0 : Math.pow(bLin, gammaDrive);

  const rMw = (rDrive * WEIGHT_R / WEIGHT_SUM) * FULL_WHITE_OLED_MW;
  const gMw = (gDrive * WEIGHT_G / WEIGHT_SUM) * FULL_WHITE_OLED_MW;
  const bMw = (bDrive * WEIGHT_B / WEIGHT_SUM) * FULL_WHITE_OLED_MW;

  const powerMw = isPixelOff ? 0 : rMw + gMw + bMw;
  const aplPercent = ((rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) * 100);

  const meanOther = (rDrive + gDrive) * 0.5;
  const blueAsymmetry = Math.max(0, bDrive - meanOther * 0.6);
  const blueStressIndex = Math.min(
    100,
    Math.round((bDrive * 0.65 + blueAsymmetry * 0.55) * 100)
  );

  return {
    hex,
    rLinear: rLin,
    gLinear: gLin,
    bLinear: bLin,
    powerMw: Math.round(powerMw * 10) / 10,
    channelPowerMw: {
      r: Math.round(rMw * 10) / 10,
      g: Math.round(gMw * 10) / 10,
      b: Math.round(bMw * 10) / 10,
    },
    aplPercent: Math.round(aplPercent * 10) / 10,
    blueStressIndex,
    isPixelOff,
  };
}

/**
 * 蓝光防烧屏寿命守卫 (Blue Subpixel Longevity Guard)
 */
export function applyBlueBurnInGuard(
  hex: string,
  options: { maxBlueAttenuation?: number; hueShiftDeg?: number } = {}
): string {
  const maxAtten = options.maxBlueAttenuation ?? 0.22;
  const maxShift = options.hueShiftDeg ?? 6.0;

  const okyct = hexToOkyct(hex);
  if (okyct.c < 0.025) return hex;

  let angularDist = Math.abs(okyct.h - 265) % 360;
  if (angularDist > 180) angularDist = 360 - angularDist;

  if (angularDist > 50) return hex;

  const weight = Math.cos((angularDist / 50) * (Math.PI / 2));
  const newChroma = okyct.c * (1 - maxAtten * weight);
  const shiftSign = okyct.h >= 195 && okyct.h <= 330 ? -1 : 1;
  const newHue = (okyct.h + shiftSign * maxShift * weight + 360) % 360;

  return okyctToHex({
    h: newHue,
    c: newChroma,
    t: okyct.t,
  });
}

/**
 * 子像素彩边抑制 (AMOLED PenTile Anti-Fringing) 与近眼眩光抑制 (MicroOLED Anti-Halation)
 */
export function applySubpixelEdgeCompensation(
  hex: string,
  profile: EmissivePanelType,
  roleKind: 'surface' | 'foreground' | 'accent'
): string {
  const okyct = hexToOkyct(hex);

  if (profile === 'amoled-anti-smear') {
    if (roleKind === 'foreground' || roleKind === 'accent') {
      const dampedC = okyct.c > 0.14 ? 0.14 + (okyct.c - 0.14) * 0.78 : okyct.c;
      const clampedT = roleKind === 'foreground' && okyct.t > 97 ? 97 : okyct.t;
      return okyctToHex({ h: okyct.h, c: dampedC, t: clampedT });
    }
  } else if (profile === 'micro-oled-xr') {
    if (roleKind === 'foreground' && okyct.t > 92) {
      return okyctToHex({ h: okyct.h, c: okyct.c * 0.9, t: 92 });
    }
    if (roleKind === 'accent' && okyct.c > 0.15) {
      return okyctToHex({ h: okyct.h, c: okyct.c * 0.85, t: Math.min(90, okyct.t) });
    }
  }

  return hex;
}

/**
 * 将自发光面板物理配置应用到任意单个 Token 键值
 */
export function applyEmissiveProfileToTokenHex(
  key: string,
  hex: string,
  options: {
    profile: EmissivePanelType;
    burnInGuard?: boolean;
    antiFringing?: boolean;
  }
): string {
  if (!/^#([0-9a-f]{6})$/i.test(hex.trim())) return hex;

  const lowerKey = key.toLowerCase();
  const okyct = hexToOkyct(hex);
  const spec = EMISSIVE_PANEL_SPECS[options.profile];

  let targetT = okyct.t;
  let targetC = okyct.c;

  if (okyct.t <= 28 && (lowerKey.includes('surface') || lowerKey.includes('background'))) {
    if (lowerKey.includes('lowest')) {
      targetT = spec.darkSurfaceTones.lowest;
    } else if (lowerKey.includes('low')) {
      targetT = spec.darkSurfaceTones.low;
    } else if (lowerKey.includes('highest')) {
      targetT = spec.darkSurfaceTones.highest;
    } else if (lowerKey.includes('high')) {
      targetT = spec.darkSurfaceTones.high;
    } else if (lowerKey.includes('bright')) {
      targetT = spec.darkSurfaceTones.bright;
    } else if (lowerKey.includes('container')) {
      targetT = spec.darkSurfaceTones.container;
    } else {
      targetT = spec.darkSurfaceTones.surface;
    }
    if (targetT === 0) targetC = 0;
  } else if (okyct.t > spec.lightPeakToneCap) {
    targetT = spec.lightPeakToneCap;
  }

  let outHex = targetT === 0 ? '#000000' : okyctToHex({ h: okyct.h, c: targetC, t: targetT });

  if (options.burnInGuard) {
    outHex = applyBlueBurnInGuard(outHex);
  }

  if (options.antiFringing) {
    const roleKind = lowerKey.includes('on')
      ? 'foreground'
      : lowerKey.includes('surface')
      ? 'surface'
      : 'accent';
    outHex = applySubpixelEdgeCompensation(outHex, options.profile, roleKind);
  }

  return outHex;
}

const UI_AREA_WEIGHTS: Array<{ role: keyof DynamicSchemeColors; weight: number }> = [
  { role: 'surface', weight: 0.42 },
  { role: 'surfaceContainerLowest', weight: 0.14 },
  { role: 'surfaceContainerLow', weight: 0.12 },
  { role: 'surfaceContainer', weight: 0.12 },
  { role: 'surfaceContainerHigh', weight: 0.06 },
  { role: 'primary', weight: 0.05 },
  { role: 'primaryContainer', weight: 0.04 },
  { role: 'secondaryContainer', weight: 0.02 },
  { role: 'onSurface', weight: 0.02 },
  { role: 'onSurfaceVariant', weight: 0.01 },
];

/**
 * 评估完整 DynamicScheme 在指定自发光面板下的物理功耗、APL、黑拖影与烧屏遥测报告
 */
export function analyzeEmissiveSchemeMetrics(
  scheme: DynamicSchemeColors,
  profile: EmissivePanelType
): SchemeEmissiveReport {
  const spec = EMISSIVE_PANEL_SPECS[profile];

  if (profile === 'standard-lcd') {
    let weightedApl = 0;
    let weightedBlueStress = 0;
    for (const item of UI_AREA_WEIGHTS) {
      const hex = scheme[item.role] as string;
      const t = computeColorEmissiveTelemetry(hex);
      weightedApl += t.aplPercent * item.weight;
      weightedBlueStress += t.blueStressIndex * item.weight;
    }

    const minContrast = Math.min(
      getContrastRatio(scheme.tones.onPrimary, scheme.tones.primary),
      getContrastRatio(scheme.tones.onSurface, scheme.tones.surface)
    );

    return {
      profile,
      spec,
      estimatedTotalPowerMw: LCD_CONSTANT_BACKLIGHT_MW,
      powerSavingsVsLcdPct: 0,
      channelPowerBreakdownMw: { r: 180, g: 180, b: 180 },
      aplPercent: Math.round(weightedApl * 10) / 10,
      ablTriggerRisk: 'Low',
      blueSubpixelStressIndex: Math.round(weightedBlueStress),
      smearRiseTimeMs: spec.smearRiseTimeMs,
      blackSmearRisk: 'None',
      pentileFringingRisk: 'Low',
      pixelOffRatioPct: 0,
      minWcagContrastAfterOpt: Math.round(minContrast * 100) / 100,
    };
  }

  let weightedR = 0;
  let weightedG = 0;
  let weightedB = 0;
  let weightedApl = 0;
  let weightedBlueStress = 0;
  let pixelOffArea = 0;

  for (const item of UI_AREA_WEIGHTS) {
    const hex = scheme[item.role] as string;
    const t = computeColorEmissiveTelemetry(hex);
    weightedR += t.channelPowerMw.r * item.weight;
    weightedG += t.channelPowerMw.g * item.weight;
    weightedB += t.channelPowerMw.b * item.weight;
    weightedApl += t.aplPercent * item.weight;
    weightedBlueStress += t.blueStressIndex * item.weight;
    if (t.isPixelOff) {
      pixelOffArea += item.weight;
    }
  }

  const primaryTelemetry = computeColorEmissiveTelemetry(scheme.primary);
  const effectiveBlueStress = Math.round(
    weightedBlueStress * 0.55 + primaryTelemetry.blueStressIndex * 0.45
  );

  const emissiveLightMw = weightedR + weightedG + weightedB;
  const totalMw = Math.round(BACKPLANE_STATIC_MW + emissiveLightMw);
  const savingsPct = Math.round(
    ((LCD_CONSTANT_BACKLIGHT_MW - totalMw) / LCD_CONSTANT_BACKLIGHT_MW) * 100
  );

  const surfTone = scheme.tones.surface;
  const lowTone = scheme.tones.surfaceContainerLowest;
  const hasZeroCutoff = surfTone === 0 || lowTone === 0;
  const blackSmearRisk: SchemeEmissiveReport['blackSmearRisk'] = hasZeroCutoff
    ? 'Severe (T=0 Cutoff)'
    : surfTone <= 2
    ? 'Minimal'
    : 'None';

  const ablTriggerRisk: SchemeEmissiveReport['ablTriggerRisk'] =
    weightedApl > 65 ? 'High' : weightedApl > 38 ? 'Moderate' : 'Low';

  const primaryOkyct = hexToOkyct(scheme.primary);
  const pentileFringingRisk: SchemeEmissiveReport['pentileFringingRisk'] =
    profile === 'amoled-anti-smear'
      ? 'Controlled'
      : primaryOkyct.c > 0.17
      ? 'Elevated'
      : 'Low';

  const minContrast = Math.min(
    getContrastRatio(scheme.tones.onPrimary, scheme.tones.primary),
    getContrastRatio(scheme.tones.onSurface, scheme.tones.surface)
  );

  return {
    profile,
    spec,
    estimatedTotalPowerMw: totalMw,
    powerSavingsVsLcdPct: savingsPct,
    channelPowerBreakdownMw: {
      r: Math.round(weightedR * 10) / 10,
      g: Math.round(weightedG * 10) / 10,
      b: Math.round(weightedB * 10) / 10,
    },
    aplPercent: Math.round(weightedApl * 10) / 10,
    ablTriggerRisk,
    blueSubpixelStressIndex: effectiveBlueStress,
    smearRiseTimeMs: hasZeroCutoff ? 18.5 : spec.smearRiseTimeMs,
    blackSmearRisk,
    pentileFringingRisk,
    pixelOffRatioPct: Math.round(pixelOffArea * 100),
    minWcagContrastAfterOpt: Math.round(minContrast * 100) / 100,
  };
}

export class OledDisplayPhysicsAdapter implements IDisplayPhysicsPort {
  getPanelSpec(profile: EmissivePanelType): EmissivePanelSpec {
    return EMISSIVE_PANEL_SPECS[profile];
  }
  applyBlueBurnInGuard = applyBlueBurnInGuard;
  applySubpixelEdgeCompensation = applySubpixelEdgeCompensation;
  computeColorEmissiveTelemetry = computeColorEmissiveTelemetry;
  analyzeEmissiveSchemeMetrics = analyzeEmissiveSchemeMetrics;
}

export const oledDisplayPhysicsAdapter = new OledDisplayPhysicsAdapter();

/**
 * 预绑定 OledDisplayPhysicsAdapter 的动态主题构建入口
 */
export function buildDynamicScheme(
  palettes: PaletteSet,
  isDark: boolean,
  contrastLevel = 0.0,
  emissiveOptions: EmissiveSchemeOptions = {}
): DynamicSchemeColors {
  return buildDynamicSchemeWithPhysics(
    palettes,
    isDark,
    contrastLevel,
    emissiveOptions,
    oledDisplayPhysicsAdapter
  );
}
