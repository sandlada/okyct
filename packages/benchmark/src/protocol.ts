/**
 * 三模型公平评测协议（CIE L* 共同目标轴）
 */

export const BenchmarkProtocolVersion = '2.0' as const

export const StandardBenchmarkTones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95] as const

export type StandardBenchmarkTone = (typeof StandardBenchmarkTones)[number]
