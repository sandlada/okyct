/**
 * [Hexagonal Layer: Outbound Port]
 * 自发光显示面板物理特性、子像素功耗遥测与烧屏/彩边补偿被驱动端契约 (一个口对应一个文件)
 * 约束：仅依赖 domain/models 与同层契约
 */

import type { DynamicSchemeColors } from '../inbound/scheme-building.port.ts';

export type EmissivePanelType =
  | 'standard-lcd'
  | 'oled-true-black'
  | 'amoled-anti-smear'
  | 'micro-oled-xr';

export type SubpixelGeometry = 'rgb-stripe' | 'diamond-pentile' | 'micro-oled-hex';

export interface EmissiveSchemeOptions {
  profile?: EmissivePanelType;
  burnInGuard?: boolean;
  antiFringing?: boolean;
}

export interface EmissivePanelSpec {
  id: EmissivePanelType;
  name: string;
  shortName: string;
  badge: string;
  subpixelGeometry: SubpixelGeometry;
  geometryLabel: string;
  description: string;
  darkSurfaceTones: {
    lowest: number;
    surface: number;
    low: number;
    container: number;
    high: number;
    highest: number;
    bright: number;
  };
  lightPeakToneCap: number;
  smearRiseTimeMs: number;
}

export interface ColorEmissiveTelemetry {
  hex: string;
  rLinear: number;
  gLinear: number;
  bLinear: number;
  /** 单像素光谱加权功耗 (以全白 100% 驱动为 1000 mW 基准) */
  powerMw: number;
  /** 各子像素功耗分解 (mW) */
  channelPowerMw: { r: number; g: number; b: number };
  /** 图像平均亮阶贡献 APL [0, 100]% */
  aplPercent: number;
  /** 蓝色子像素老化应力指数 [0, 100] */
  blueStressIndex: number;
  /** 是否处于完全断电关断态 (True Black #000000) */
  isPixelOff: boolean;
}

export interface SchemeEmissiveReport {
  profile: EmissivePanelType;
  spec: EmissivePanelSpec;
  /** 整屏典型 UI 布局加权预估功耗 (mW) */
  estimatedTotalPowerMw: number;
  /** 相比传统恒定背光 LCD (540mW) 的省电百分比 */
  powerSavingsVsLcdPct: number;
  /** R / G / B 三原色子像素功耗分解 (mW) */
  channelPowerBreakdownMw: { r: number; g: number; b: number };
  /** 整屏加权平均图像亮阶 APL (%) */
  aplPercent: number;
  /** 硬件 ABL 自动限亮触发风险 */
  ablTriggerRisk: 'Low' | 'Moderate' | 'High';
  /** 蓝色子像素烧屏老化应力指数 [0, 100] */
  blueSubpixelStressIndex: number;
  /** 滚动黑拖影响应耗时 (ms) */
  smearRiseTimeMs: number;
  /** 黑拖影风险等级 */
  blackSmearRisk: 'None' | 'Minimal' | 'Severe (T=0 Cutoff)';
  /** PenTile 钻石排列边缘彩边风险 */
  pentileFringingRisk: 'Low' | 'Controlled' | 'Elevated';
  /** 完全断电零功耗关断像素面积占比 (%) */
  pixelOffRatioPct: number;
  /** 核心对比度守卫复核 (确保面板优化后主要配对仍 100% 达标) */
  minWcagContrastAfterOpt: number;
}

export interface IDisplayPhysicsPort {
  getPanelSpec(profile: EmissivePanelType): EmissivePanelSpec;
  applyBlueBurnInGuard(
    hex: string,
    options?: { maxBlueAttenuation?: number; hueShiftDeg?: number }
  ): string;
  applySubpixelEdgeCompensation(
    hex: string,
    profile: EmissivePanelType,
    roleKind: 'surface' | 'foreground' | 'accent'
  ): string;
  computeColorEmissiveTelemetry(hex: string): ColorEmissiveTelemetry;
  analyzeEmissiveSchemeMetrics(
    scheme: DynamicSchemeColors,
    profile: EmissivePanelType
  ): SchemeEmissiveReport;
}
