/**
 * [Hexagonal Layer: Outbound Port]
 * 多格式生产级设计 Token 导出器被驱动端契约 (一个口对应一个文件)
 * 约束：仅依赖 domain/models 与同层契约
 */

import type { DynamicSchemeColors, ResolvedCustomColor } from '../inbound/scheme-building.port.ts';
import type { PaletteSet, ITonalPalettePort } from '../inbound/palette-generation.port.ts';

export interface ITokenExporterPort<TPalette extends ITonalPalettePort = ITonalPalettePort> {
  exportCssVariables(
    lightScheme: DynamicSchemeColors,
    darkScheme: DynamicSchemeColors,
    palettes: PaletteSet<TPalette>,
    customColorsLight?: ResolvedCustomColor[],
    customColorsDark?: ResolvedCustomColor[]
  ): string;

  exportTailwindV4(
    lightScheme: DynamicSchemeColors,
    darkScheme: DynamicSchemeColors,
    customColorsLight?: ResolvedCustomColor[]
  ): string;

  exportW3cDesignTokens(
    lightScheme: DynamicSchemeColors,
    darkScheme: DynamicSchemeColors,
    customColorsLight?: ResolvedCustomColor[],
    customColorsDark?: ResolvedCustomColor[]
  ): string;

  exportTypeScriptTokens(
    lightScheme: DynamicSchemeColors,
    darkScheme: DynamicSchemeColors,
    customColorsLight?: ResolvedCustomColor[],
    customColorsDark?: ResolvedCustomColor[]
  ): string;
}
