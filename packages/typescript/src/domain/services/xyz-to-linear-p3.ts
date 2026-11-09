
import type { RGB, XYZ } from '../models/index.ts'

export function xyzToLinearP3(xyz: XYZ): RGB {
  return {
    r:  2.4934969 * xyz.x - 0.9313836 * xyz.y - 0.4027108 * xyz.z,
    g: -0.8294890 * xyz.x + 1.7626641 * xyz.y + 0.0236247 * xyz.z,
    b:  0.0358458 * xyz.x - 0.0761724 * xyz.y + 0.9568845 * xyz.z,
  }
}
