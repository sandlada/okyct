import type { PagePreviewStrings } from './page-preview-strings.ts'
import { PreviewIcons, RailIcons } from './preview-icons.ts'

export type SamplePreviewCopy = PagePreviewStrings & {
  metricPrimary: string
  metricSecondary: string
  metricTertiary: string
  listValues: readonly string[]
  customChips: readonly { cssBase: string; label: string }[]
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function pillMarkup(status: 'error' | 'success' | undefined, label: string | undefined): string {
  if (!status || !label) return ''
  const tone = status === 'error' ? 'pill--error' : 'pill--success'
  return `<span class="pill ${tone}">${escapeHtml(label)}</span>`
}

export function buildSamplePreviewDocument(tokenCss: string, themeClass: 'light' | 'dark', copy: SamplePreviewCopy): string {
  const listRows = copy.listRows
    .map(
      (row, index) => `<li class="feed-row">
          <div class="feed-row__dot" aria-hidden="true"></div>
          <div class="feed-row__text">
            <span class="feed-row__title">${escapeHtml(row.title)}</span>
            <span class="feed-row__meta">${escapeHtml(copy.listValues[index] ?? '')}</span>
          </div>
          ${pillMarkup(row.status, row.statusLabel)}
        </li>`,
    )
    .join('\n              ')

  const customRows = copy.customChips
    .map(
      (chip) => `<li class="feed-row">
          <div class="feed-row__dot feed-row__dot--custom pill--custom-${escapeHtml(chip.cssBase)}" aria-hidden="true"></div>
          <div class="feed-row__text">
            <span class="feed-row__title">${escapeHtml(chip.label)}</span>
          </div>
          <span class="pill pill--custom pill--custom-${escapeHtml(chip.cssBase)}">${escapeHtml(chip.label)}</span>
        </li>`,
    )
    .join('\n              ')

  const customChipCss = copy.customChips
    .map(
      (chip) => `
    .pill--custom-${chip.cssBase}, .feed-row__dot--custom.pill--custom-${chip.cssBase} {
      background: var(--md-custom-color-${chip.cssBase}-container);
      color: var(--md-custom-color-on-${chip.cssBase}-container);
    }`,
    )
    .join('')

  const railItems = RailIcons.map(
    (icon, index) => `<span class="rail__item${index === 0 ? ' rail__item--active' : ''}" title="${escapeHtml(copy.railLabels[index] ?? '')}">
        <span class="rail__glyph">${icon}</span>
      </span>`,
  ).join('\n        ')

  return `<!DOCTYPE html>
<html lang="${escapeHtml(copy.lang)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(copy.pageTitle)}</title>
  <style>
${tokenCss}

    *, *::before, *::after { box-sizing: border-box; margin: 0; }
    html { height: 100%; }
    body {
      min-height: 100%;
      font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
      font-size: 13px;
      line-height: 1.45;
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      -webkit-font-smoothing: antialiased;
    }
    button, input { font: inherit; }
    .icon { display: block; flex-shrink: 0; }
    .app { display: flex; flex-direction: column; min-height: 100vh; }
  </style>
  <style>
    .app-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0 1.25rem;
      height: 3.25rem;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-container);
    }
    .app-bar__mark {
      width: 2rem;
      height: 2rem;
      border-radius: 6px;
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      display: grid;
      place-items: center;
    }
    .app-bar__search-wrap {
      flex: 1;
      max-width: 18rem;
      height: 2rem;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0 0.5rem;
      border-radius: 6px;
      background: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-on-surface-variant);
    }
    .app-bar__search {
      flex: 1;
      min-width: 0;
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface);
      outline: none;
      font-size: 12px;
    }
    .app-bar__search::placeholder { color: var(--md-sys-color-on-surface-variant); }
    .app-bar__actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-left: auto;
    }
    .app-bar__icon {
      width: 2rem;
      height: 2rem;
      border-radius: 6px;
      display: grid;
      place-items: center;
      background: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-on-surface-variant);
    }
    .app-bar__avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      background: var(--md-sys-color-tertiary-container);
      color: var(--md-sys-color-on-tertiary-container);
      font-size: 11px;
      font-weight: 600;
      display: grid;
      place-items: center;
    }

    .app-main {
      flex: 1;
      display: grid;
      grid-template-columns: 4rem minmax(0, 1fr);
      min-height: 0;
    }
    .rail {
      padding: 0.75rem 0.5rem;
      border-right: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-container-low);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .rail__item {
      height: 2.5rem;
      border-radius: 8px;
      display: grid;
      place-items: center;
      color: var(--md-sys-color-on-surface-variant);
    }
    .rail__item--active {
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
    }

    .workspace {
      padding: 1.5rem 1.75rem 2rem;
      overflow: auto;
      background: var(--md-sys-color-surface);
    }
    .workspace-inner {
      max-width: 54rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .page-title {
      font-size: 1.35rem;
      font-weight: 650;
      letter-spacing: -0.02em;
    }

    .callout {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 12px;
      background: var(--md-sys-color-info-container);
      color: var(--md-sys-color-on-info-container);
    }
    .callout__icon { color: var(--md-sys-color-info); }
    .hint-warn {
      font-size: 11px;
      color: var(--md-sys-color-on-warning-container);
      background: var(--md-sys-color-warning-container);
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      align-self: flex-start;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.65rem;
    }
    .metric {
      padding: 0.85rem 1rem;
      border-radius: 10px;
      border: 1px solid var(--md-sys-color-outline-variant);
    }
    .metric__label {
      font-size: 11px;
      font-weight: 600;
      opacity: 0.8;
    }
    .metric__value {
      margin-top: 0.35rem;
      font-size: 1.1rem;
      font-weight: 650;
      font-variant-numeric: tabular-nums;
    }
    .metric--primary {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }
    .metric--secondary {
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
    }
    .metric--tertiary {
      background: var(--md-sys-color-tertiary-container);
      color: var(--md-sys-color-on-tertiary-container);
    }

    .main-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
      gap: 1rem;
      align-items: start;
    }
    @media (max-width: 720px) {
      .app-main { grid-template-columns: 1fr; }
      .rail { display: none; }
      .metrics { grid-template-columns: 1fr; }
      .main-grid { grid-template-columns: 1fr; }
    }

    .panel {
      border-radius: 10px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-container-low);
      overflow: hidden;
    }
    .panel__head {
      padding: 0.75rem 1rem;
      font-size: 12px;
      font-weight: 650;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-container);
    }
    .panel__body { padding: 1rem; }
    .chart {
      display: flex;
      align-items: flex-end;
      gap: 0.45rem;
      height: 7.5rem;
      padding-top: 0.5rem;
    }
    .chart__bar {
      flex: 1;
      min-width: 0;
      border-radius: 4px 4px 0 0;
    }
    .chart__bar:nth-child(1) { height: 42%; background: var(--md-sys-color-primary); }
    .chart__bar:nth-child(2) { height: 68%; background: var(--md-sys-color-primary-container); }
    .chart__bar:nth-child(3) { height: 55%; background: var(--md-sys-color-secondary); }
    .chart__bar:nth-child(4) { height: 80%; background: var(--md-sys-color-secondary-container); }
    .chart__bar:nth-child(5) { height: 48%; background: var(--md-sys-color-tertiary); }
    .chart__bar:nth-child(6) { height: 72%; background: var(--md-sys-color-tertiary-container); }
    .chart__bar:nth-child(7) { height: 36%; background: var(--md-sys-color-error-container); border: 1px solid var(--md-sys-color-error); }

    .panel__foot {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 0.85rem;
      border-top: 1px solid var(--md-sys-color-outline-variant);
    }
    .btn {
      padding: 0.45rem 0.9rem;
      border-radius: 999px;
      border: none;
      font-size: 12px;
      font-weight: 600;
    }
    .btn--filled {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    }
    .btn--ghost {
      background: transparent;
      color: var(--md-sys-color-on-surface-variant);
      border: 1px solid var(--md-sys-color-outline-variant);
    }

    .feed { list-style: none; }
    .feed-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.65rem;
      align-items: center;
      padding: 0.65rem 1rem;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    .feed-row:last-child { border-bottom: none; }
    .feed-row__dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: var(--md-sys-color-outline);
    }
    .feed-row__title {
      display: block;
      font-size: 12px;
      font-weight: 600;
    }
    .feed-row__meta {
      display: block;
      margin-top: 0.1rem;
      font-size: 10px;
      color: var(--md-sys-color-on-surface-variant);
      font-variant-numeric: tabular-nums;
    }
    .pill {
      padding: 0.12rem 0.45rem;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
    }
    .pill--error {
      background: var(--md-sys-color-error);
      color: var(--md-sys-color-on-error);
    }
    .pill--success {
      background: var(--md-sys-color-success-container);
      color: var(--md-sys-color-on-success-container);
    }
    .pill--custom {
      font-size: 9px;
      max-width: 4.5rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    ${customChipCss}
  </style>
</head>
<body class="${themeClass}">
  <div class="app">
    <header class="app-bar">
      <span class="app-bar__mark">${PreviewIcons.brand}</span>
      <label class="app-bar__search-wrap">
        ${PreviewIcons.search}
        <input class="app-bar__search" type="search" value="" disabled placeholder="${escapeHtml(copy.searchPlaceholder)}" />
      </label>
      <div class="app-bar__actions">
        <span class="app-bar__icon">${PreviewIcons.bell}</span>
        <span class="app-bar__avatar" aria-hidden="true">U</span>
      </div>
    </header>

    <div class="app-main">
      <nav class="rail" aria-label="">${railItems}</nav>
      <main class="workspace">
        <div class="workspace-inner">
          <h1 class="page-title">${escapeHtml(copy.pageTitle)}</h1>

          <p class="callout">
            <span class="callout__icon">${PreviewIcons.info}</span>
            ${escapeHtml(copy.infoAlert)}
          </p>

          <p class="hint-warn">${escapeHtml(copy.warningHint)}</p>

          <section class="metrics">
            <article class="metric metric--primary">
              <p class="metric__label">${escapeHtml(copy.metrics.primary)}</p>
              <p class="metric__value">${escapeHtml(copy.metricPrimary)}</p>
            </article>
            <article class="metric metric--secondary">
              <p class="metric__label">${escapeHtml(copy.metrics.secondary)}</p>
              <p class="metric__value">${escapeHtml(copy.metricSecondary)}</p>
            </article>
            <article class="metric metric--tertiary">
              <p class="metric__label">${escapeHtml(copy.metrics.tertiary)}</p>
              <p class="metric__value">${escapeHtml(copy.metricTertiary)}</p>
            </article>
          </section>

          <div class="main-grid">
            <article class="panel">
              <header class="panel__head">${escapeHtml(copy.chartTitle)}</header>
              <div class="panel__body">
                <div class="chart" aria-hidden="true">
                  <span class="chart__bar"></span>
                  <span class="chart__bar"></span>
                  <span class="chart__bar"></span>
                  <span class="chart__bar"></span>
                  <span class="chart__bar"></span>
                  <span class="chart__bar"></span>
                  <span class="chart__bar"></span>
                </div>
                <div class="panel__foot">
                  <button type="button" class="btn btn--filled" disabled>${escapeHtml(copy.btnPrimary)}</button>
                  <button type="button" class="btn btn--ghost" disabled>${escapeHtml(copy.btnSecondary)}</button>
                </div>
              </div>
            </article>

            <section class="panel">
              <header class="panel__head">${escapeHtml(copy.listTitle)}</header>
              <ul class="feed">
                ${listRows}
                ${customRows}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  </div>
</body>
</html>`
}
