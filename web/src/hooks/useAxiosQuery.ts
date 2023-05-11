import type { QueriesOptions, QueryKey, UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { keys, values, zip } from 'lodash-es'
import { useMemo } from 'react'
import { ErrorInternal } from 'src/helpers/ErrorInternal'
import { axiosFetch } from 'src/io/axiosFetch'
import { useQueries } from './useQueriesWithSuspense'

const QUERY_OPTIONS_DEFAULT = {
  staleTime: Number.POSITIVE_INFINITY,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchInterval: Number.POSITIVE_INFINITY,
}

function queryOptionsDefaulted<T>(options: T) {
  let newOptions = QUERY_OPTIONS_DEFAULT
  if (options) {
    newOptions = { ...newOptions, ...options }
  }
  return newOptions
}

export type QueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'initialData'> & {
  initialData?: () => undefined
}

export type UseAxiosQueryOptions<TData = unknown> = QueryOptions<TData, Error, TData, string[]>
export type UseAxiosQueriesOptions<TData = unknown> = QueriesOptions<TData[]>

/** Makes a cached fetch request */
export function useAxiosQuery<TData = unknown>(url: string, options?: UseAxiosQueryOptions<TData>): TData {
  const newOptions = useMemo(() => queryOptionsDefaulted(options), [options])
  const res = useQuery<TData, Error, TData, string[]>([url], async () => axiosFetch(url), newOptions)
  return useMemo(() => {
    if (!res.data) {
      throw new Error(`Fetch failed: ${url}`)
    }
    return res.data
  }, [res.data, url])
}

/** Make multiple cached fetches in parallel (and uses `Suspense`, by contrast to the default `useQueries()`)  */
export function useAxiosQueries<TData = unknown>(
  namedUrls: Record<string, string>,
  options?: UseAxiosQueriesOptions<TData>,
): TData {
  const newOptions = useMemo(() => queryOptionsDefaulted(options), [options])

  const results = useQueries({
    queries: values(namedUrls).map((url) => ({
      ...newOptions,
      suspense: true,
      useErrorBoundary: true,
      queryKey: [url],
      queryFn: async () => axiosFetch(url),
    })),
    options: {
      suspense: true,
    },
  })

  return useMemo(() => {
    return Object.fromEntries(
      zip(keys(namedUrls), values(namedUrls), results).map(([key, url, result]) => {
        if (!key || !url || !result) {
          throw new ErrorInternal('useAxiosQueries: Attempted to zip arrays of different sizes.')
        }

        if (!result.data) {
          throw new Error(`Fetch failed: ${key}: ${url}`)
        }
        return [key, result.data]
      }),
    )
  }, [namedUrls, results]) as unknown as TData
}
