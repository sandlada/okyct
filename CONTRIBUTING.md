# 贡献指南

## 1. 环境准备

- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 12.18.0`

安装依赖（仓库根目录执行）：
```bash
pnpm install
```

---

## 2. pnpm 工作区指令

所有指令均在**仓库根目录**执行，严禁跨目录穿透：

| 用途 | 指令 | 说明 |
| --- | --- | --- |
| **启动开发服务器** | `pnpm dev` | 启动 OKYCT Studio 前端站点（`http://localhost:3000`） |
| **启动 Dev-App** | `pnpm dev:app` | 启动开发合规验真工作台（`http://localhost:3001`） |
| **完整构建** | `pnpm build` | 依序构建核心引擎、前端站点与 dev-app |
| **仅构建核心引擎** | `pnpm build:core` | 编译 `@sandlada/okyct` |
| **仅构建前端站点** | `pnpm build:site` | 构建 `@sandlada/site`（输出至 `packages/site/dist/`） |
| **仅构建 Dev-App** | `pnpm build:dev-app` | 构建 `@sandlada/dev-app`（输出至 `packages/dev-app/dist/`） |
| **预览构建产物** | `pnpm preview` | 本地静态预览生产构建结果 |
| **类型检查** | `pnpm lint` / `pnpm typecheck` | 执行全库 TypeScript 检查 (`tsc --noEmit`) |
| **清理构建产物** | `pnpm clean` | 清理所有 `dist/` 目录 |

---

## 3. 提交前验证

提交代码或发起 PR 前，必须确保以下两项检查无任何报错：

```bash
pnpm lint   # 类型检查必须全绿
pnpm build  # 构建产物必须无错误
```

架构、分层与代码规范详见 [AGENTS.md](./AGENTS.md)。
