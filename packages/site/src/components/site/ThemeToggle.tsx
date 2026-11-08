/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Moon, Sun } from 'lucide-react'
import { useI18n } from '../../i18n/index.tsx'
import { useTheme } from '../../theme/index.tsx'

interface ThemeToggleProps {
  readonly className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme()
  const { t } = useI18n()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? t('theme.toLight') : t('theme.toDark')}
      aria-label={isDark ? t('theme.toLight') : t('theme.toDark')}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-900/5 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white ${className}`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
