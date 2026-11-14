# OKYCT

Website: [okyct.sandlada.com](https://okyct.sandlada.com)

OKYCT is a perceptual color model and emissive dynamic color system developed by Sandlada. It is designed to address perceptual distortion, computational overhead, and hardware physical limitations of traditional color spaces (sRGB, HSL, CIELAB, and CAM16/HCT) on high-refresh-rate emissive displays and accessible typography.

**OKYCT** is named after its core colorimetric dimensions:
- **OK**: Based on the **OKLab** perceptually uniform color space (providing a linear polar hue angle $H$)
- **Y**: Strictly anchored to **CIE 1931 relative luminance $Y$**
- **C**: **Chroma** (perceptual chroma magnitude $C = \sqrt{a^2 + b^2}$)
- **T**: **Tone** (visual lightness $T \in [0, 100]$, strictly bijective with CIE $Y$)

## Highlights

- **Perceptual Uniformity & Hue Fidelity**: Built on OKLab polar coordinates and CIE 1931 relative luminance, eliminating hue shifts and lightness distortions in the blue-violet region found in traditional color spaces.
- **Ultra-Fast Pure Computation Engine**: Zero external runtime dependencies; pure TypeScript implementation delivering millisecond-level color space conversions and palette generation.
- **Zero-Hue-Drift Gamut Mapping**: Supports sRGB and Display P3 wide-gamut mapping while keeping perceptual hue stable when converging at gamut boundaries.
- **Emissive Display Physics Optimization**: Provides anti-black-smearing, burn-in prevention, and anti-halation modes tailored for OLED, AMOLED, and MicroOLED panels.
- **Deterministic Accessibility Contrast**: Native support for WCAG 2.1 and APCA perceptual contrast calculation as well as closed-form target contrast inversion to guarantee text readability.

## Installation

> Note: `@sandlada/okyct` is currently under active development.

```bash
npm install @sandlada/okyct
# or
pnpm add @sandlada/okyct
```

## Repository Structure

- [packages/typescript](./packages/typescript/README.md) (`@sandlada/okyct`): Core colorimetric engine and dynamic color library (with Dart and Rust implementations planned).
- [packages/benchmark](./packages/benchmark/README.md) (`@sandlada/benchmark`): Performance and colorimetric accuracy benchmark suite.
- [packages/site](./packages/site/README.md) (`@sandlada/site`): Interactive color science workbench **OKYCT Studio**.
