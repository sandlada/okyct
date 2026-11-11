/**
 * 计算两个色相角之间的最短圆周夹角 [0, 180]
 */

export function shortestHueDelta(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2) % 360
  return diff > 180 ? 360 - diff : diff
}
