import {
  createTheme,
  okyctToHex,
  type CssSchemeMode,
  type EmissivePanelType,
  type OkyctTheme,
  type PaletteVariant,
  type StandardPaletteKey,
  type SystemColorToken,
  type ThemeMode,
  type TokenExportFormat,
} from '@sandlada/okyct'

interface DemoState {
  sourceHex: string
  variant: PaletteVariant
  mode: ThemeMode
  contrastLevel: number
  emissiveProfile: EmissivePanelType
  burnInGuard: boolean
  exportFormat: TokenExportFormat
  cssSchemeMode: CssSchemeMode
  cssPrefix: string
}

const DefaultState: DemoState = {
  sourceHex: '#6750A4',
  variant: 'tonalSpot',
  mode: 'light',
  contrastLevel: 0,
  emissiveProfile: 'standard-lcd',
  burnInGuard: false,
  exportFormat: 'css',
  cssSchemeMode: 'class',
  cssPrefix: '--md-sys-color',
}

const HexColorPattern = /^#[0-9A-Fa-f]{6}$/

let activeTheme: OkyctTheme | null = null
let snackbarTimer: ReturnType<typeof setTimeout> | undefined

function showSnackbar(message: string): void {
  const snackbar = document.getElementById('m3-snackbar')
  if (!snackbar) return
  snackbar.textContent = message
  snackbar.classList.add('is-visible')
  if (snackbarTimer !== undefined) {
    clearTimeout(snackbarTimer)
  }
  snackbarTimer = setTimeout(() => {
    snackbar.classList.remove('is-visible')
  }, 2200)
}

function formatContrastLabel(level: number): string {
  if (level <= -0.5) return `${level.toFixed(1)} (Reduced)`
  if (level >= 0.8) return `${level.toFixed(1)} (High)`
  if (level >= 0.4) return `${level.toFixed(1)} (Medium)`
  return `${level.toFixed(1)} (Standard)`
}

function formatExportCode(theme: OkyctTheme, state: DemoState): string {
  const raw = theme.export(state.exportFormat, {
    cssSchemeMode: state.cssSchemeMode,
  })
  const prefix = state.cssPrefix.trim()
  if (!prefix || prefix === '--md-sys-color') return raw
  const normalized = prefix.startsWith('--') ? prefix : `--${prefix}`
  return raw.replaceAll('--md-sys-color', normalized)
}

function applyThemeState(state: DemoState): void {
  const theme = createTheme({
    sourceHex: state.sourceHex,
    variant: state.variant,
    contrastLevel: state.contrastLevel,
    emissive: {
      profile: state.emissiveProfile,
      burnInGuard: state.burnInGuard,
    },
  })
  activeTheme = theme

  const cssOutput = theme.export('css', {
    cssSchemeMode: 'class',
  })

  const styleEl = document.getElementById('okyct-dynamic-theme')
  if (styleEl) {
    styleEl.textContent = cssOutput
  }

  document.documentElement.classList.toggle('dark', state.mode === 'dark')
  document.documentElement.classList.toggle('light', state.mode === 'light')

  const okyctReadout = document.getElementById('hero-okyct-readout')
  if (okyctReadout) {
    const { h, c, t } = theme.sourceOkyct
    okyctReadout.textContent = `H ${Math.round(h)}° · C ${c.toFixed(2)} · T ${Math.round(t)}`
  }

  const playerTitle = document.getElementById('player-hue-title')
  if (playerTitle) {
    playerTitle.textContent = `Perceptual Hue ${Math.round(theme.sourceOkyct.h)}°`
  }

  const powerReadout = document.getElementById('hero-power-readout')
  if (powerReadout) {
    const report = theme.analyzeEmissive(state.mode)
    powerReadout.textContent = `${report.estimatedTotalPowerMw.toFixed(0)} mW (${report.powerSavingsVsLcdPct.toFixed(0)}% saved)`
  }

  const auditItems = theme.auditContrast(state.mode)
  const auditReadout = document.getElementById('hero-audit-readout')
  if (auditReadout) {
    const passed = auditItems.filter((item) => item.wcagPassAA).length
    auditReadout.textContent = `${passed}/${auditItems.length} WCAG AA`
  }

  const activeScheme = theme.scheme(state.mode)
  const roleHexElements = document.querySelectorAll<HTMLElement>('[data-role-hex]')
  for (const el of roleHexElements) {
    const key = el.dataset.roleHex as SystemColorToken | undefined
    if (key && key in activeScheme) {
      el.textContent = activeScheme[key].toUpperCase()
    }
  }

  const rampButtons = document.querySelectorAll<HTMLButtonElement>('[data-ramp-palette][data-ramp-tone]')
  for (const btn of rampButtons) {
    const paletteKey = btn.dataset.rampPalette as StandardPaletteKey | undefined
    const toneStr = btn.dataset.rampTone
    if (!paletteKey || !toneStr) continue
    const tone = Number.parseInt(toneStr, 10)
    const swatch = btn.querySelector<HTMLElement>('[data-ramp-swatch]') ?? btn
    swatch.style.backgroundColor = theme.palettes[paletteKey].tone(tone)
  }

  const auditGrid = document.getElementById('contrast-audit-grid')
  if (auditGrid) {
    auditGrid.replaceChildren(
      ...auditItems.slice(0, 8).map((item) => {
        const card = document.createElement('div')
        card.className = 'm3-audit-item'

        const pair = document.createElement('div')
        pair.className = 'm3-audit-pair'
        pair.textContent = `${item.fgRole} / ${item.bgRole}`

        const metrics = document.createElement('div')
        metrics.className = 'm3-audit-metrics'

        const ratio = document.createElement('span')
        ratio.textContent = `${item.wcagRatio.toFixed(1)}:1 · Lc ${Math.round(Math.abs(item.apcaLc))}`

        const badge = document.createElement('span')
        badge.className = 'm3-audit-badge'
        badge.textContent = item.wcagPassAAA ? 'AAA' : item.wcagPassAA ? 'AA' : 'Check'

        metrics.append(ratio, badge)
        card.append(pair, metrics)
        return card
      })
    )
  }

  const codeEl = document.getElementById('css-export-output')
  if (codeEl) {
    codeEl.textContent = formatExportCode(theme, state)
  }
}

export function initDemoThemeController(): void {
  const state: DemoState = { ...DefaultState }

  const colorPicker = document.getElementById('seed-color-picker') as HTMLInputElement | null
  const hexInput = document.getElementById('seed-hex-input') as HTMLInputElement | null
  const contrastSlider = document.getElementById('contrast-slider') as HTMLInputElement | null
  const contrastLabel = document.getElementById('contrast-value-label')
  const emissiveSelect = document.getElementById('emissive-profile-select') as HTMLSelectElement | null
  const burnInToggle = document.getElementById('burn-in-guard-toggle') as HTMLInputElement | null
  const showcaseBurnInSwitch = document.getElementById('showcase-subpixel-switch') as HTMLInputElement | null
  const namespaceInput = document.getElementById('showcase-namespace-input') as HTMLInputElement | null
  const railModeToggle = document.getElementById('rail-mode-toggle')
  const copyCssBtn = document.getElementById('copy-css-btn')
  const downloadExportBtn = document.getElementById('download-export-btn')
  const fabRandomizeBtn = document.getElementById('fab-randomize-btn')
  const fabEditBtn = document.getElementById('fab-edit-btn')
  const playerToggleBtn = document.getElementById('player-toggle-btn')
  const playerProgress = document.getElementById('player-progress-fill')

  const presetBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-seed-preset]'))
  const variantBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-variant-btn]'))
  const modeBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode-btn]'))
  const cssModeBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-css-mode-btn]'))
  const formatTabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-export-format]'))
  const roleCards = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-role-copy]'))
  const demoBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-demo-btn]'))
  const rampStops = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-ramp-palette]'))
  const navBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-panel-index]'))
  const switchBtns = Array.from(document.querySelectorAll<HTMLElement>('[data-switch-panel]'))
  const panelTrack = document.getElementById('m3-panel-track')

  const switchPanel = (index: number) => {
    const clamped = Math.max(0, Math.min(4, index))
    if (panelTrack) {
      panelTrack.style.setProperty('--active-panel', String(clamped))
    }
    for (const btn of navBtns) {
      btn.classList.toggle('is-active', Number(btn.dataset.panelIndex) === clamped)
    }
  }

  const syncSeedInputs = (hex: string) => {
    const normalized = hex.toUpperCase()
    state.sourceHex = normalized
    if (colorPicker) colorPicker.value = normalized
    if (hexInput) hexInput.value = normalized
    for (const btn of presetBtns) {
      btn.classList.toggle('is-selected', btn.dataset.seedPreset?.toUpperCase() === normalized)
    }
    applyThemeState(state)
  }

  for (const btn of presetBtns) {
    btn.addEventListener('click', () => {
      const hex = btn.dataset.seedPreset
      if (hex && HexColorPattern.test(hex)) {
        syncSeedInputs(hex)
      }
    })
  }

  colorPicker?.addEventListener('input', () => {
    if (HexColorPattern.test(colorPicker.value)) {
      syncSeedInputs(colorPicker.value)
    }
  })

  hexInput?.addEventListener('input', () => {
    const raw = hexInput.value.trim()
    const candidate = raw.startsWith('#') ? raw : `#${raw}`
    if (HexColorPattern.test(candidate)) {
      syncSeedInputs(candidate)
    }
  })

  for (const btn of variantBtns) {
    btn.addEventListener('click', () => {
      const variant = btn.dataset.variantBtn as PaletteVariant | undefined
      if (!variant) return
      state.variant = variant
      for (const item of variantBtns) {
        item.classList.toggle('is-selected', item === btn)
      }
      applyThemeState(state)
    })
  }

  const setMode = (mode: ThemeMode) => {
    state.mode = mode
    for (const btn of modeBtns) {
      btn.classList.toggle('is-selected', btn.dataset.modeBtn === mode)
    }
    applyThemeState(state)
  }

  for (const btn of modeBtns) {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.modeBtn as ThemeMode | undefined
      if (mode) setMode(mode)
    })
  }

  railModeToggle?.addEventListener('click', () => {
    setMode(state.mode === 'light' ? 'dark' : 'light')
  })

  contrastSlider?.addEventListener('input', () => {
    const val = Number.parseFloat(contrastSlider.value)
    if (!Number.isFinite(val)) return
    state.contrastLevel = val
    if (contrastLabel) {
      contrastLabel.textContent = formatContrastLabel(val)
    }
    applyThemeState(state)
  })

  emissiveSelect?.addEventListener('change', () => {
    state.emissiveProfile = emissiveSelect.value as EmissivePanelType
    applyThemeState(state)
  })

  const setBurnInGuard = (enabled: boolean) => {
    state.burnInGuard = enabled
    if (burnInToggle) burnInToggle.checked = enabled
    if (showcaseBurnInSwitch) showcaseBurnInSwitch.checked = enabled
    applyThemeState(state)
    showSnackbar(`Blue Burn-in Guard ${enabled ? 'enabled' : 'disabled'}`)
  }

  burnInToggle?.addEventListener('change', () => {
    setBurnInGuard(burnInToggle.checked)
  })

  showcaseBurnInSwitch?.addEventListener('change', () => {
    setBurnInGuard(showcaseBurnInSwitch.checked)
  })

  namespaceInput?.addEventListener('input', () => {
    state.cssPrefix = namespaceInput.value
    if (activeTheme) {
      const codeEl = document.getElementById('css-export-output')
      if (codeEl) {
        codeEl.textContent = formatExportCode(activeTheme, state)
      }
    }
  })

  fabRandomizeBtn?.addEventListener('click', () => {
    const randomHue = Math.floor(Math.random() * 360)
    const nextHex = okyctToHex({ h: randomHue, c: 0.16, t: 48 })
    syncSeedInputs(nextHex)
    showSnackbar(`Generated perceptual seed ${nextHex.toUpperCase()} (H ${randomHue}°)`)
  })

  fabEditBtn?.addEventListener('click', () => {
    switchPanel(2)
    setTimeout(() => {
      hexInput?.focus()
      hexInput?.select()
    }, 320)
  })

  for (const btn of demoBtns) {
    btn.addEventListener('click', () => {
      const info = btn.dataset.demoBtn
      if (info) {
        showSnackbar(`Active M3 Token: ${info}`)
      }
    })
  }

  for (const tab of formatTabs) {
    tab.addEventListener('click', () => {
      const format = tab.dataset.exportFormat as TokenExportFormat | undefined
      if (!format) return
      state.exportFormat = format
      for (const item of formatTabs) {
        item.classList.toggle('is-selected', item === tab)
      }
      applyThemeState(state)
    })
  }

  for (const btn of cssModeBtns) {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.cssModeBtn as CssSchemeMode | undefined
      if (!mode) return
      state.cssSchemeMode = mode
      for (const item of cssModeBtns) {
        item.classList.toggle('is-selected', item === btn)
      }
      applyThemeState(state)
    })
  }

  downloadExportBtn?.addEventListener('click', () => {
    const codeEl = document.getElementById('css-export-output')
    if (!codeEl?.textContent) return
    const extMap: Record<TokenExportFormat, string> = {
      css: 'css',
      tailwind: 'css',
      w3c: 'json',
      ts: 'ts',
    }
    const blob = new Blob([codeEl.textContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `okyct-tokens.${extMap[state.exportFormat]}`
    link.click()
    URL.revokeObjectURL(url)
    showSnackbar(`Downloaded okyct-tokens.${extMap[state.exportFormat]}`)
  })

  for (const card of roleCards) {
    card.addEventListener('click', async () => {
      const key = card.dataset.roleCopy
      if (!key) return
      const hexEl = card.querySelector<HTMLElement>('[data-role-hex]')
      const hex = hexEl?.textContent
      if (!hex || hex === '#------') return
      await navigator.clipboard.writeText(hex)
      showSnackbar(`Copied ${key}: ${hex}`)
    })
  }

  for (const stop of rampStops) {
    stop.addEventListener('click', async () => {
      const paletteKey = stop.dataset.rampPalette as StandardPaletteKey | undefined
      const toneStr = stop.dataset.rampTone
      if (!paletteKey || !toneStr || !activeTheme) return
      const tone = Number.parseInt(toneStr, 10)
      const hex = activeTheme.palettes[paletteKey].tone(tone).toUpperCase()
      await navigator.clipboard.writeText(hex)
      showSnackbar(`Copied ${paletteKey} T${tone}: ${hex}`)
    })
  }

  let playing = false
  playerToggleBtn?.addEventListener('click', () => {
    playing = !playing
    const playIcon = playerToggleBtn.querySelector<SVGElement>('.icon-play')
    const pauseIcon = playerToggleBtn.querySelector<SVGElement>('.icon-pause')
    if (playIcon) playIcon.style.display = playing ? 'none' : 'block'
    if (pauseIcon) pauseIcon.style.display = playing ? 'block' : 'none'
    if (playerProgress) {
      playerProgress.style.width = playing ? '82%' : '64%'
    }
    showSnackbar(playing ? 'Playing perceptual sweep' : 'Playback paused')
  })

  copyCssBtn?.addEventListener('click', async () => {
    const codeEl = document.getElementById('css-export-output')
    if (!codeEl?.textContent) return
    await navigator.clipboard.writeText(codeEl.textContent)
    showSnackbar(`Copied ${state.exportFormat.toUpperCase()} tokens to clipboard`)
  })

  for (const btn of navBtns) {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.panelIndex)
      if (Number.isFinite(idx)) {
        switchPanel(idx)
      }
    })
  }

  for (const btn of switchBtns) {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.switchPanel)
      if (Number.isFinite(idx)) {
        switchPanel(idx)
      }
    })
  }

  applyThemeState(state)
}

initDemoThemeController()
