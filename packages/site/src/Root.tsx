/**
 * 应用根组件：主题 → 路由 → 语言 → 页面。
 * 该组件同时用于浏览器渲染与 SSR 预渲染（entry-server），
 * 因此模块作用域内不得触碰 window / document。
 */

import { lazy, Suspense } from 'react'
import { Provider } from 'react-redux'
import { useState } from 'react'
import { createAppStore } from './app/store.ts'
import { ThemeSync } from './features/theme/ThemeSync.tsx'
import { RouterProvider, useRouter } from './router/index.tsx'
import { I18nProvider, useI18n } from './i18n/index.tsx'
import { useDocumentHead } from './seo/index.ts'
import { LandingPage } from './features/landing/components/LandingPage.tsx'
import { NotFoundPage } from './features/not-found/components/NotFoundPage.tsx'

const StudioApp = lazy(() => import('./features/studio/components/StudioApp.tsx'))

function StudioFallback() {
  const { t } = useI18n()
  return (
    <div className="flex h-screen w-full items-center justify-center bg-neutral-100 text-sm text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
      {t('studio.loading')}
    </div>
  )
}

function RoutedApp() {
  const { route } = useRouter()
  useDocumentHead(route)

  return (
    <I18nProvider locale={route.locale}>
      {route.kind === 'landing' && <LandingPage />}
      {route.kind === 'not-found' && <NotFoundPage />}
      {route.kind === 'studio' && (
        <Suspense fallback={<StudioFallback />}>
          <StudioApp key={route.locale} />
        </Suspense>
      )}
    </I18nProvider>
  )
}

export function Root({ url }: { readonly url?: string }) {
  const [store] = useState(() => createAppStore())
  return (
    <Provider store={store}>
      <ThemeSync />
      <RouterProvider initialPath={url}>
        <RoutedApp />
      </RouterProvider>
    </Provider>
  )
}
