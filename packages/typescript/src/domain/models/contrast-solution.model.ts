/**
 * [Hexagonal Layer: Domain Model]
 * O(1) 代数对比度反演方程求解结果模型
 * 约束：零外部依赖
 */

export interface ContrastSolution {
  darkForegroundTone: number | null;
  lightForegroundTone: number | null;
}
