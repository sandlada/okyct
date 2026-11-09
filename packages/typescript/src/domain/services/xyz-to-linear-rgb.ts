
import type { RGB, XYZ } from '../models/index.ts'

export function xyzToLinearRgb(xyz: XYZ): RGB {
  return {
    r:  3.2404542 * xyz.x - 1.5371385 * xyz.y - 0.4985314 * xyz.z,
    g: -0.9692660 * xyz.x + 1.8760108 * xyz.y + 0.0415560 * xyz.z,
    b:  0.0556434 * xyz.x - 0.2040259 * xyz.y + 1.0572252 * xyz.z,
  }
}
