# @sandlada/dev-app — OKYCT 透明度追踪与合规审计工作台

> 本项目为 `OKYCT` 核心色度学与自发光物理配色引擎的开发者内部工作台，专用于算法验真、过程透明化追踪与合规性审查。

---

## 核心定位

1. **直连 TypeScript 源码运行**：
   通过 Vite 与 TypeScript 别名直接引用 `packages/typescript/src/index.ts`，零中间产物阻隔，热更新实时调试算法。
2. **全过程透明度 (Transparency Trace)**：
   - 种子色色度空间参数全量解构（OKLab $L, a, b$、极坐标 $H, C$、CIE 1931 $Y$、Tone、单变量牛顿切线法求解步数与微秒级耗时、OLED 加权功耗）。
   - 13 级色阶全透明计算细节（生理色度包络衰减、Cusp 尖峰折返状态、$\Delta H$ 绝对零漂移保证）。
   - 53 个系统色彩 Token 的派生与映射图谱。
3. **严谨结果合规性审计 (Compliance Audit)**：
   - **无障碍对比度合规**：17 组核心前景/背景配对实时计算 WCAG 2.1 比例与 APCA $L_c$ 得分，验证 AA/AAA 达标率。
   - **sRGB 色域越界审计**：检验全部 53 个 Token 通道是否在 $[0, 1]$ 内（0 越界率保证）。
   - **色貌与数学不变量自检**：实时运行 `runColorimetricInvariantSuite()`，检验往返还原精度、Tone $\leftrightarrow$ $Y$ 双射单调性、360° 色相零漂移与 $O(1)$ 代数对比度反演方程。
   - **自发光硬件工程合规**：验证 AMOLED 120Hz 亚阈值微起辉（$T \ge 4$ 防果冻黑拖影）、MicroOLED XR Pancake 透镜防眩光限幅（$T \le 92$）及蓝色有机发光材料防烧屏平滑衰减。
   - **MD3 Token 规范完整性**：验证 53 个系统 Token（包含新增的 `inverseOnPrimary`, `inversePrimaryContainer`, `inverseOnPrimaryContainer`, `info`, `onInfo`, `infoContainer`, `onInfoContainer`）覆盖率 100%。
4. **多模型色相漂移对比 (Hue Drift Compare)**：
   - **当前色阶漂移横向对标**：T10 ~ T95 全色阶并列对比自研 OKYCT、Google HCT (CAM16) 与传统 HSL 的实测 OKLab 色相角度与 $\Delta H$。
   - **四大极限应力测试场景**：纯蓝（Abney 效应区）、鲜红（Cusp 尖峰折返）、柠檬黄（高光失真区）、高饱和洋红（非光谱边界）。
   - **360° 全色相环全息扫描**：以 15° 步长进行 24 点全色相环高色度应力扫描，量化 OKYCT 相较 CAM16 在蓝紫区域逆向色相扭曲上的优胜幅度。

---

## 本地开发与构建

在根目录执行：
```bash
# 启动 dev-app 开发服务器 (默认端口 3001)
pnpm dev:app

# 执行类型检查
pnpm --filter @sandlada/dev-app run lint

# 构建生产产物
pnpm --filter @sandlada/dev-app run build
```
