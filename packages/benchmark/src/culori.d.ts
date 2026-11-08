declare module 'culori' {
  export interface OklchColor {
    mode: 'oklch'
    l: number
    c: number
    h?: number
    alpha?: number
  }

  export function oklch(color: string | unknown): OklchColor | undefined
  export function formatHex(color: unknown): string
  export function clampChroma<T>(color: T, mode?: string): T
}
