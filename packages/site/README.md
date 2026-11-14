# @sandlada/site (OKYCT Studio)

**OKYCT Studio** —— 面向自发光显示与无障碍排版的交互式色彩科学工作台，基于 React 19、Vite 8 与 Tailwind CSS v4 构建。

## 核心功能

- **动态配色与 Tokens 预览**：实时调节种子色、变体与对比度区间（`-1.0 ~ 1.0`），按需生成 MD3 CSS Tokens。
- **三维色域可视化**：基于 Three.js 渲染 OKYCT 色彩空间、sRGB / Display P3 色域外壳及 Cusp 折返路径。
- **自发光物理模拟**：切换 `oled-true-black`、`amoled-anti-smear` 与 `micro-oled-xr` 模式，查看功耗遥测与防烧屏约束。
- **对比度与基准评测**：内置 WCAG 2.1 / APCA 实时审计与性能基准对比。

## 开发与许可证

- **构建与运行**：参阅 [CONTRIBUTING.md](../../CONTRIBUTING.md)
- **许可证**：[MIT](./LICENSE)
