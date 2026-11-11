/**
 * [Hexagonal Layer: Domain Model]
 * 色度学数学不变量自检套件结果模型
 * 约束：零外部依赖
 */

export interface InvariantTestResult {
  id: string
  name: string
  formula: string
  passed: boolean
  measuredValue: string
  threshold: string
  samplesChecked: number
  details: string
}
