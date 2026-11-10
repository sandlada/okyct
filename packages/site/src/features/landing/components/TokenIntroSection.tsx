import type { DynamicSchemeColors, SystemColorToken } from '../../../color/scheme.ts'
import { useI18n } from '../../../i18n/index.tsx'
import type { LandingSchemes } from '../palette.ts'

const AccentRoles = [
  { fill: 'primary', ink: 'onPrimary', labelKey: 'tokens.roles.primary' },
  { fill: 'primaryContainer', ink: 'onPrimaryContainer', labelKey: 'tokens.roles.primaryContainer' },
  { fill: 'secondary', ink: 'onSecondary', labelKey: 'tokens.roles.secondary' },
  { fill: 'tertiary', ink: 'onTertiary', labelKey: 'tokens.roles.tertiary' },
] as const

const StatusRoles = [
  { fill: 'error', ink: 'onError', labelKey: 'tokens.roles.error' },
  { fill: 'warning', ink: 'onWarning', labelKey: 'tokens.roles.warning' },
  { fill: 'success', ink: 'onSuccess', labelKey: 'tokens.roles.success' },
  { fill: 'info', ink: 'onInfo', labelKey: 'tokens.roles.info' },
] as const

const SurfaceRoles = [
  { token: 'surfaceDim', labelKey: 'tokens.roles.surfaceDim' },
  { token: 'surfaceContainerLow', labelKey: 'tokens.roles.surfaceContainerLow' },
  { token: 'surfaceContainer', labelKey: 'tokens.roles.surfaceContainer' },
  { token: 'surfaceContainerHigh', labelKey: 'tokens.roles.surfaceContainerHigh' },
  { token: 'surfaceContainerHighest', labelKey: 'tokens.roles.surfaceContainerHighest' },
] as const

const Notes = [
  { titleKey: 'tokens.primary.title', bodyKey: 'tokens.primary.body' },
  { titleKey: 'tokens.surface.title', bodyKey: 'tokens.surface.body' },
  { titleKey: 'tokens.status.title', bodyKey: 'tokens.status.body' },
] as const

export function TokenIntroSection({ schemes }: { readonly schemes: LandingSchemes }) {
  const { t } = useI18n()

  return (
    <section id="tokens" className="relative scroll-mt-24 border-t border-neutral-900/10 py-24 sm:py-32 dark:border-white/10">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8">
        <div className="max-w-5xl pl-7 sm:pl-9">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
            {t('tokens.eyebrow')}
          </span>
          <h2 className="mt-6 font-display text-[clamp(1.9rem,4.6vw,4rem)] font-medium leading-[1.04] tracking-[-0.035em] text-balance">
            {t('tokens.title')}
          </h2>
          <p className="mt-8 max-w-3xl text-pretty text-base leading-relaxed text-neutral-600 sm:text-[17px] dark:text-neutral-400">
            {t('tokens.body')}
          </p>
        </div>

        <dl className="mt-12 grid gap-8 pl-7 sm:grid-cols-3 sm:pl-9">
          {Notes.map((note) => (
            <div key={note.titleKey}>
              <dt className="font-display text-base font-semibold tracking-tight">{t(note.titleKey)}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{t(note.bodyKey)}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <SchemeBoard title={t('tokens.light')} scheme={schemes.light} />
          <SchemeBoard title={t('tokens.dark')} scheme={schemes.dark} />
        </div>
      </div>
    </section>
  )
}

function SchemeBoard({ title, scheme }: { readonly title: string; readonly scheme: DynamicSchemeColors }) {
  const { t } = useI18n()

  return (
    <div>
      <h3 className="font-display text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{title}</h3>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {AccentRoles.map((role) => (
          <RoleChip key={role.fill} scheme={scheme} fill={role.fill} ink={role.ink} label={t(role.labelKey)} />
        ))}
        {SurfaceRoles.map((role) => (
          <RoleChip key={role.token} scheme={scheme} fill={role.token} ink="onSurface" label={t(role.labelKey)} />
        ))}
        {StatusRoles.map((role) => (
          <RoleChip key={role.fill} scheme={scheme} fill={role.fill} ink={role.ink} label={t(role.labelKey)} />
        ))}
      </div>
    </div>
  )
}

function RoleChip({
  scheme,
  fill,
  ink,
  label,
}: {
  readonly scheme: DynamicSchemeColors
  readonly fill: SystemColorToken
  readonly ink: SystemColorToken
  readonly label: string
}) {
  return (
    <div
      className="flex min-h-16 items-end rounded-2xl px-3.5 py-3 text-sm font-semibold tracking-tight ring-1 ring-inset ring-black/10 dark:ring-white/15"
      style={{ backgroundColor: scheme[fill], color: scheme[ink] }}
    >
      {label}
    </div>
  )
}
