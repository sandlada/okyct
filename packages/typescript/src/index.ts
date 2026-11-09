/**
 * OKYCT Color Engine — Unified Hexagonal Public Entry
 *
 * 架构分层 (Hexagonal / Ports & Adapters):
 * - Layer 1: domain/       (models/* 单模型单文件 + services/* 纯色度学数学引擎)
 * - Layer 2: ports/        (inbound/* 驱动端口 + outbound/* 被驱动端口，单口单文件)
 * - Layer 3: application/  (调色板、按需定制MD3 CSS Tokens、N层叠加编排用例)
 * - Layer 4: adapters/     (OLED物理面板、多格式导出、图像量化、CAM16评测、FP组合子)
 */

export * from './domain/index.ts';
export * from './ports/index.ts';
export * from './application/index.ts';
export { type PaletteSet } from './application/index.ts';
export * from './adapters/index.ts';
export * from './architecture-guard.ts';

