
import { applyBlueBurnInGuard } from '../driven-emissive-oled/index.ts'

export const limitBlueEmission = (
  options: { maxBlueAttenuation?: number; hueShiftDeg?: number } = {}
) =>
  (colorHex: string): string => {
    return applyBlueBurnInGuard(colorHex, options)
  }
