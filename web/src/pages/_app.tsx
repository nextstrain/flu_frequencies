import 'reflect-metadata'
import 'resize-observer-polyfill/dist/ResizeObserver.global'
import Route from 'route-parser'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import React, { PropsWithChildren, Suspense, useEffect, useMemo } from 'react'
import { QueryClient, QueryClientConfig, QueryClientProvider } from '@tanstack/react-query'
import { RecoilRoot, RecoilEnv, useRecoilCallback } from 'recoil'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { AppProps } from 'next/app'
import NextProgress from 'next-progress'
import { ThemeProvider } from 'styled-components'
import { MDXProvider } from '@mdx-js/react'
import { I18nextProvider } from 'react-i18next'
import i18n, { changeLocale, getLocaleWithKey } from 'src/i18n/i18n'
import { loadPolyfills } from 'src/polyfills'
import { theme } from 'src/theme'
import { DOMAIN_STRIPPED } from 'src/constants'
import { Plausible } from 'src/components/Common/Plausible'
import { LOADING } from 'src/components/Loading/Loading'
import { getMdxComponents } from 'src/components/Common/MdxComponents'
import { ErrorBoundary } from 'src/components/Error/ErrorBoundary'
import { Layout } from 'src/components/Layout/Layout'
import { PathogenPage } from 'src/components/Pathogen/PathogenPage'
import { RegionsPage } from 'src/components/Regions/RegionsPage'
import { VariantsPage } from 'src/components/Variants/VariantsPage'
import { RegionPage } from 'src/components/Regions/RegionPage'
import { VariantPage } from 'src/components/Variants/VariantPage'
import { localeAtom } from 'src/state/locale.state'
import 'src/styles/global.scss'

const NotFoundPage = dynamic(() => import('src/pages/404'))

RecoilEnv.RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED = false

const REACT_QUERY_OPTIONS: QueryClientConfig = {
  defaultOptions: {
    queries: {
      suspense: true,
      retry: 1,
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchInterval: Number.POSITIVE_INFINITY,
    },
  },
}

const NEXT_PROGRESS_OPTIONS = { showSpinner: false }

export function RecoilStateInitializer() {
  // const router = useRouter()

  // // NOTE: Do manual parsing, because router.query is randomly empty on the first few renders and on repeated renders.
  // // This is important, because various states depend on query, and when it changes back and forth,
  // // the state also changes unexpectedly.
  // const { query: urlQuery } = useMemo(() => parseUrl(router.asPath), [router.asPath])

  const initialize = useRecoilCallback(({ set, snapshot }) => () => {
    const snapShotRelease = snapshot.retain()
    const { getPromise } = snapshot

    // eslint-disable-next-line no-void
    void Promise.resolve()
      // eslint-disable-next-line promise/always-return
      .then(async () => {
        // const localeKeyFromUrl = getQueryParamMaybe(urlQuery, 'lang')
        const localeKey = await getPromise(localeAtom)
        const locale = getLocaleWithKey(localeKey)
        await changeLocale(i18n, locale.key)
        set(localeAtom, locale.key)
        // void setLocaleInUrl(localeKey) // eslint-disable-line no-void
      })
      .finally(() => {
        snapShotRelease()
      })
  })

  useEffect(() => {
    initialize()
  })

  return null
}

function matchRoute<T extends Record<string, string | undefined>>(asPath: string, route: string) {
  const routeMatcher = new Route<T>(route)
  return routeMatcher.match(asPath)
}

// HACK: primitive router. Replace with something more sturdy
function Router({ children }: PropsWithChildren) {
  const { asPath, route } = useRouter()

  const { Component } = useMemo(() => {
    {
      const match = matchRoute(asPath, '/pathogen/:pathogenName')
      if (match) {
        const { pathogenName } = match
        return { Component: <PathogenPage pathogenName={pathogenName} />, pathogenName }
      }
    }
    {
      const match = matchRoute(asPath, '/pathogen/:pathogenName/variants')
      if (match) {
        const { pathogenName } = match
        return { Component: <VariantsPage pathogenName={pathogenName} />, pathogenName }
      }
    }
    {
      const match = matchRoute(asPath, '/pathogen/:pathogenName/regions')
      if (match) {
        const { pathogenName } = match
        return { Component: <RegionsPage pathogenName={pathogenName} />, pathogenName }
      }
    }
    {
      const match = matchRoute(asPath, '/pathogen/:pathogenName/variants/:variant')
      if (match) {
        const { pathogenName, variant } = match
        return { Component: <VariantPage pathogenName={pathogenName} variantName={variant} />, pathogenName }
      }
    }
    {
      const match = matchRoute(asPath, '/pathogen/:pathogenName/regions/:region')
      if (match) {
        const { pathogenName, region } = match
        return { Component: <RegionPage pathogenName={pathogenName} location={region} />, pathogenName }
      }
    }

    if (asPath !== route) {
      return { Component: <NotFoundPage /> }
    }

    return { Component: children }
  }, [asPath, children, route])

  return (
    <RecoilRoot>
      <MDXProvider components={getMdxComponents}>
        <Layout>
          <Suspense fallback={LOADING}>
            <RecoilStateInitializer />
            {Component}
          </Suspense>
        </Layout>
      </MDXProvider>
    </RecoilRoot>
  )
}

function MyApp({ Component, pageProps }: AppProps) {
  const queryClient = useMemo(() => new QueryClient(REACT_QUERY_OPTIONS), [])

  return (
    <Suspense fallback={LOADING}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <I18nextProvider i18n={i18n}>
              <Plausible domain={DOMAIN_STRIPPED} />
              <NextProgress delay={100} options={NEXT_PROGRESS_OPTIONS} />
              <Suspense fallback={LOADING}>
                <Router>
                  <Component {...pageProps} />
                </Router>
              </Suspense>
              <ReactQueryDevtools initialIsOpen={false} />
            </I18nextProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </Suspense>
  )
}

async function run() {
  await loadPolyfills()
  return MyApp
}

export default dynamic(() => run(), { ssr: false })
