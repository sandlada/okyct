
import { DefaultBrandColors } from '../brand-colors.ts'

interface BrandMarkProps {
  readonly colors?: readonly [string, string, string]
  readonly size?: number
}

export function BrandMark({ colors = DefaultBrandColors, size = 24 }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="16" cy="11.5" r="7" fill={colors[0]} />
      <circle cx="10.5" cy="20" r="6" fill={colors[1]} opacity="0.82" />
      <circle cx="21.5" cy="20" r="6" fill={colors[2]} opacity="0.62" />
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeOpacity="0.12" />
    </svg>
  )
}
