import { useI18n } from '../../../i18n/index.tsx'

const SandladaSocial = {
  Site: 'https://sandlada.com',
  GitHub: 'https://github.com/sandlada/okyct',
  Npm: 'https://www.npmjs.com/package/@sandlada/okyct',
  KaiOrionGitHub: 'https://github.com/kai-orion',
} as const

const SocialLinkClass =
  'relative inline-flex text-neutral-900 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current dark:text-neutral-50'

const WordmarkLinkClass =
  'relative inline-block font-wordmark text-[48px] leading-none text-inherit no-underline outline-none hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current'

export function SiteFooter() {
  const { t } = useI18n()

  return (
    <footer className="relative z-0">
      <div className="h-px bg-neutral-900/15 dark:bg-white/15" aria-hidden="true" />
      <div className="mx-auto my-8 w-full px-6 min-[600px]:max-w-[600px] min-[840px]:max-w-[840px] min-[1200px]:max-w-[1200px] min-[1600px]:max-w-[1600px]">
        <section className="flex items-center gap-4 py-6">
          <a
            href={SandladaSocial.GitHub}
            target="_blank"
            rel="noopener"
            aria-label={t('footer.github')}
            className={SocialLinkClass}
          >
            <GitHubMark />
          </a>
          <a
            href={SandladaSocial.Npm}
            target="_blank"
            rel="noopener"
            aria-label={t('footer.npm')}
            className={SocialLinkClass}
          >
            <NpmMark />
          </a>
        </section>

        <section className="my-6 flex flex-wrap items-end gap-x-8 gap-y-2 text-neutral-600 dark:text-neutral-400">
          <a
            className={WordmarkLinkClass}
            target="_blank"
            rel="noopener"
            href={SandladaSocial.Site}
            aria-label={t('footer.sandlada')}
          >
            Sandlada
          </a>
          <a
            className={WordmarkLinkClass}
            target="_blank"
            rel="noopener"
            href={SandladaSocial.KaiOrionGitHub}
            aria-label={t('footer.kaiOrion')}
          >
            Kai Orion
          </a>
        </section>
      </div>
    </footer>
  )
}

function GitHubMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm2.218 18.616c-.354.069-.468-.149-.468-.336v-1.921c0-.653-.229-1.079-.481-1.296 1.56-.173 3.198-.765 3.198-3.454 0-.765-.273-1.389-.721-1.879.072-.177.312-.889-.069-1.853 0 0-.587-.188-1.923.717-.561-.154-1.159-.231-1.754-.234-.595.003-1.193.08-1.753.235-1.337-.905-1.925-.717-1.925-.717-.379.964-.14 1.676-.067 1.852-.448.49-.722 1.114-.722 1.879 0 2.682 1.634 3.282 3.189 3.459-.2.175-.381.483-.444.936-.4.179-1.413.488-2.037-.582 0 0-.37-.672-1.073-.722 0 0-.683-.009-.048.426 0 0 .46.215.777 1.024 0 0 .405 1.25 2.353.826v1.303c0 .185-.113.402-.462.337-2.782-.925-4.788-3.549-4.788-6.641 0-3.867 3.135-7 7-7s7 3.133 7 7c0 3.091-2.003 5.715-4.782 6.641z"
      />
    </svg>
  )
}

function NpmMark() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 1024 1024" aria-hidden="true">
      <circle cx="512" cy="512" r="512" fill="currentColor" />
      <path
        className="fill-[var(--okyct-page)] dark:fill-[var(--okyct-page-dark)]"
        d="M407.26 599.29h69.83v-34.92h69.83V424.71H407.26zm69.83-139.66H512v69.83h-34.91zm97.76-34.91v139.65h69.83V459.63h34.91v104.74h34.91V459.63h34.91v104.74h34.91V424.71zM239.67 564.37h69.83V459.63h34.91v104.74h34.91V424.71H239.67z"
      />
    </svg>
  )
}
