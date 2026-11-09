/**
 * D65 sRGB ↔ CIELAB（评测裁判，独立于参赛库）
 */

import { hexToRgb } from '@sandlada/okyct'

const D65 = {
  Xn: 0.95047,
  Yn: 1.0,
  Zn: 1.08883,
}

const Epsilon = 216 / 24389
const Kappa = 24389 / 27

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function linearToXyz(r: number, g: number, b: number) {
  return {
    x: 0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    y: 0.2126729 * r + 0.7151522 * g + 0.0721750 * b,
    z: 0.0193339 * r + 0.1191920 * g + 0.9503041 * b,
  }
}

function f(t: number): number {
  return t > Epsilon ? Math.cbrt(t) : (Kappa * t + 16) / 116
}

export interface Cielab {
  readonly L: number
  readonly a: number
  readonly b: number
}

export function hexToCielab(hex: string): Cielab {
  const rgb = hexToRgb(hex)
  const r = srgbToLinear(rgb.r)
  const g = srgbToLinear(rgb.g)
  const b = srgbToLinear(rgb.b)
  const xyz = linearToXyz(r, g, b)
  const fx = f(xyz.x / D65.Xn)
  const fy = f(xyz.y / D65.Yn)
  const fz = f(xyz.z / D65.Zn)
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  }
}

export function cielabChroma(lab: Cielab): number {
  return Math.hypot(lab.a, lab.b)
}

export function cielabHueDeg(lab: Cielab): number {
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI
  if (h < 0) h += 360
  return h
}

export function shortestHueDeltaDeg(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2) % 360
  return diff > 180 ? 360 - diff : diff
}

export const calculateAngleDelta = shortestHueDeltaDeg
