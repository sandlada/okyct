
import type { XYZ, OKLab } from '../models/index.ts'

export function xyzToOklab(xyz: XYZ): OKLab {
  const l = 0.8189330101 * xyz.x + 0.3618667424 * xyz.y - 0.1288597137 * xyz.z
  const m = 0.0329845436 * xyz.x + 0.9293118715 * xyz.y + 0.0361456387 * xyz.z
  const s = 0.0482003018 * xyz.x + 0.2643662691 * xyz.y + 0.6338517070 * xyz.z

  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)

  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  }
}
