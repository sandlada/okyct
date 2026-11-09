/**
 * 应用根组件：主题 → 路由 → 语言 → 页面。
 * 该组件同时用于浏览器渲染与 SSR 预渲染（entry-server），
 * 因此模块作用域内不得触碰 window / document。
 */

import { Suspense, lazy } from 'react'
import { RouterProvider, useRouter } from './router/index.tsx'
import { studioPath } from './router/routes.ts'
import { ThemeProvider } from './theme/index.tsx'
import { I18nProvider, useI18n } from './i18n/index.tsx'
import { useDocumentHead } from './seo/index.ts'
import { LandingPage } from './pages/LandingPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'

const StudioApp = lazy(() => import('./App.tsx'))

function StudioFallback() {
  const { t } = useI18n()
  return (
    <div className="flex h-screen w-full items-center justify-center bg-neutral-100 text-sm text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
      {t('studio.loading')}
    </div>
  )
}

function RoutedApp() {
  const { route, navigate } = useRouter()
  useDocumentHead(route)

  return (
    <I18nProvider locale={route.locale}>
      {route.kind === 'landing' && <LandingPage />}
      {route.kind === 'not-found' && <NotFoundPage />}
      {route.kind === 'studio' && (
        <Suspense fallback={<StudioFallback />}>
          <StudioApp
            key={route.locale}
            view={route.view}
            onViewChange={(view) => navigate(studioPath(route.locale, view))}
          />
        </Suspense>
      )}
    </I18nProvider>
  )
}

export function Root({ url }: { readonly url?: string }) {
  return (
    <ThemeProvider>
      <RouterProvider initialPath={url}>
        <RoutedApp />
      </RouterProvider>
    </ThemeProvider>
  )
}
