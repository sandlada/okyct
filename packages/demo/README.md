# `@sandlada/demo`

Interactive Material Design 3 (`m3.material.io`) style showcase built with **Astro** for **StackBlitz** live preview, powered by `@sandlada/okyct@0.0.1-20261114.b`.

## Features

- **Live Dynamic Color Controller**: Seed hex picker, 6 Material palette variants, continuous contrast slider (`-1.0` to `+1.0`), Light/Dark mode toggle, and emissive display physics (`OLED True Black`, `AMOLED Anti-Smear`, `MicroOLED XR`, and Blue Burn-in Guard).
- **M3 UI Components & 5-Level Surface Hierarchy**: Interactive buttons, FABs, semantic chips, media player, outlined inputs, switches, and shadow-free tonal surface steps.
- **Deterministic Contrast Audit & Multi-Format Export**: Live WCAG 2.1 & APCA Lc audit cards, 13-stop tonal palettes, click-to-copy role swatches, and export tabs for CSS Variables, Tailwind v4, W3C Design Tokens, and TypeScript.

## Running Locally

From the repository root:

```bash
pnpm dev:demo
```

Or inside `packages/demo` (e.g. StackBlitz):

```bash
npm install
npm run dev
```
