
import { applyBlueBurnInGuard } from '../driven-emissive-oled/apply-blue-burn-in-guard.ts'

export const limitBlueEmission = (
  options: { maxBlueAttenuation?: number; hueShiftDeg?: number } = {}
) =>
  (colorHex: string): string => {
    return applyBlueBurnInGuard(colorHex, options)
  }
