<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# OKYCT & OKYCT Studio

自研 OKYCT 感知色彩模型与自发光动态配色系统，集成自发光显示物理优化（OLED / AMOLED / MicroOLED）、WCAG 2.1 / APCA 双对比度保证，借鉴 MCU 变体与按需定制 MD3 CSS Tokens 规范。

- **产品名**: OKYCT（多语言生态与项目统称 `okyct`）
- **核心库**: `@sandlada/okyct` (NPM，目前暂未正式发布；后续规划 Dart、Rust 等实现)
- **前端工作台**: OKYCT Studio (`packages/site`)

View your app in AI Studio: https://ai.studio/apps/ee36e0f8-26d3-48ef-bb70-907a0c76b109

## Monorepo Architecture

- **`packages/typescript` (`@sandlada/okyct`)**: 核心六边形架构色度学数学模型、求解器、物理优化与设计 Token 导出库。
- **`packages/site` (`@sandlada/site`)**: 前端 React 实时工作台。

## Quick Start & Contributing

详细的环境准备、构建指令清单（`build`, `dev`, `lint`, `clean` 等）与贡献流程，请参阅 **[CONTRIBUTING.md](./CONTRIBUTING.md)**。

快速体验：
```bash
pnpm install
pnpm dev
```
