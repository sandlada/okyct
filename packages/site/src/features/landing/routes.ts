/** 落地页占据「去掉语言前缀后没有剩余段」的路径。 */
export function isLandingPath(segments: readonly string[]): boolean {
  return segments.length === 0
}
