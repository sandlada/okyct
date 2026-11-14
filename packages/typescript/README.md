# @sandlada/okyct

OKYCT 感知色彩模型与自发光动态配色引擎（TypeScript 核心实现，尚未发布至 NPM）。

## 核心特性

- **OKYCT 色彩模型**：OKLab 极坐标色相角 $H$ 与色度 $C$，结合锚定 CIE 1931 相对亮度 $Y$ 的视明度 $T \in [0, 100]$。
- **牛顿切线求解器**：单变量解析导数迭代，无外部运行时依赖。
- **Cusp 尖峰折返**：sRGB / Display P3 色域映射，保持色相零漂移（$\Delta H = 0^\circ$）。
- **自发光显示优化**：支持 `oled-true-black`、`amoled-anti-smear`、`micro-oled-xr` 预设及蓝光防烧屏约束。
- **$O(1)$ 对比度求解**：WCAG 2.1 闭式反求与 APCA ($L_c$) 审计。
- **MD3 Tokens 导出**：按需生成精简 Tokens，支持 CSS Variables、Tailwind v4、W3C Design Tokens 与 TypeScript。

## 快速使用

```typescript
import { createTheme, exportTheme, TokenExportFormats } from '@sandlada/okyct'

const theme = createTheme('#3B82F6', {
  variant: 'tonalSpot',
  contrastLevel: 0,
  panelType: 'amoled-anti-smear',
})

const css = exportTheme(theme, {
  format: TokenExportFormats.CssVariables,
})
```

### 导出入口

- `@sandlada/okyct`：统一公共 API
- `@sandlada/okyct/domain`：纯色度学数学核与对比度/色域服务
- `@sandlada/okyct/ports`：输入/输出契约边界
- `@sandlada/okyct/application`：调色板、动态配色方案与 N 层叠加用例
- `@sandlada/okyct/adapters`：物理模型、导出器、图像量化与函数式算子

## 开发与许可证

- **开发与测试**：参阅 [CONTRIBUTING.md](../../CONTRIBUTING.md)
- **许可证**：[MIT](./LICENSE)
