import { useCallback } from 'react'
import { isString } from 'lodash-es'
import type { TOptions } from 'i18next'
import { useTranslation } from 'react-i18next'

export type TFunction = (key: string, options?: Record<string, unknown>) => string

export interface UseTranslationSafeResult {
  t: TFunction
}

export function useTranslationSafe(): UseTranslationSafeResult {
  const response = useTranslation()
  const t = useCallback(
    (key: string, options?: TOptions): string => {
      const res = response.t(key, options ?? {})
      if (isString(res)) {
        return res
      }
      return key
    },
    [response],
  )
  return { t }
}
