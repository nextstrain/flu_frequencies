import React, { useMemo } from 'react'
import { useRecoilValue } from 'recoil'
import styled from 'styled-components'
import { get, isNil, reverse, sortBy, uniqBy } from 'lodash-es'
import type { Props as DefaultTooltipContentProps } from 'recharts/types/component/DefaultTooltipContent'
import { maybe } from 'src/helpers/notUndefined'
import { formatDateWeekly, formatInteger, formatProportion, formatRange } from 'src/helpers/format'
import { useCountryStyle } from 'src/io/getData'
import { localeAtom } from 'src/state/locale.state'
import { ColoredBox } from 'src/components/Common/ColoredBox'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'

const EPSILON = 1e-2

const Tooltip = styled.div`
  display: flex;
  flex-direction: column;
  padding: 5px 10px;
  background-color: ${(props) => props.theme.plot.tooltip.background};
  box-shadow: ${(props) => props.theme.shadows.blurredMedium};
  border-radius: 3px;
  outline: none;
`

const TooltipTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  margin: 5px auto;
`

const TooltipTable = styled.table`
  padding: 30px 35px;
  font-size: 0.8rem;
  border: none;
  min-width: 250px;
`

export interface VariantsPlotTooltipProps extends DefaultTooltipContentProps<number, string> {
  metadata: { pathogenName: string }
}

// HACK: TODO: this component is not type safe. Typings in `recharts` are broken.
export function VariantsPlotTooltip({ payload, metadata }: VariantsPlotTooltipProps) {
  const { t } = useTranslationSafe()

  const result = useMemo(() => {
    if (!payload || payload.length === 0) {
      return null
    }

    const date = formatDateWeekly(payload[0]?.payload?.timestamp)

    const data = reverse(sortBy(uniqBy(payload, 'name'), 'value'))

    const rows = data.map(({ name, payload }) => {
      const country = name ?? '?'
      const range = get(payload.ranges, country)
      const value = get(payload.avgs, country)
      const count = get(payload.counts, country)
      const total = get(payload.totals, country)

      return (
        <VariantsPlotTooltipRow
          key={country}
          pathogenName={metadata.pathogenName}
          country={country}
          value={value}
          range={range}
          count={count}
          total={total}
        />
      )
    })

    return { date, rows }
  }, [metadata.pathogenName, payload])

  if (!result) {
    return result
  }
  const { date, rows } = result

  return (
    <Tooltip>
      <TooltipTitle>{date}</TooltipTitle>

      <TooltipTable>
        <thead>
          <tr className="w-100">
            <th className="px-2 text-left">{t('Country')}</th>
            <th className="px-2 text-right">{t('Freq.')}</th>
            <th className="px-2 text-right">{t('Interval')}</th>
            <th className="px-2 text-right">{t('Count')}</th>
            <th className="px-2 text-right">{t('Total')}</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </TooltipTable>
    </Tooltip>
  )
}

interface VariantsPlotTooltipRowProps {
  pathogenName: string
  country: string
  value: number | undefined
  range: [number, number] | undefined
  count: number | undefined
  total: number | undefined
}

function VariantsPlotTooltipRow({ pathogenName, country, value, range, count, total }: VariantsPlotTooltipRowProps) {
  const locale = useRecoilValue(localeAtom)
  const { t } = useTranslationSafe()
  const { color } = useCountryStyle(pathogenName, country)

  const valueDisplay = useMemo(() => {
    if (!isNil(value)) {
      if (value > EPSILON) {
        return formatProportion(locale)(value)
      }
      return `<${formatProportion(locale)(EPSILON)}`
    }
    return '-'
  }, [locale, value])

  const rangeDisplay = useMemo(() => {
    if (!isNil(range)) {
      return formatRange(locale)(range[0], range[1])
    }
    return null
  }, [locale, range])

  const countDisplay = useMemo(() => maybe(formatInteger(locale), count), [count, locale])
  const totalDisplay = useMemo(() => maybe(formatInteger(locale), total), [total, locale])

  return (
    <tr key={country}>
      <td className="px-2 text-left">
        <ColoredBox $size={16} $color={color} />
        <span className="ml-2">{t(country)}</span>
      </td>
      <td className="px-2 text-right">{valueDisplay}</td>
      <td className="px-2 text-right">{rangeDisplay}</td>
      <td className="px-2 text-right">{countDisplay}</td>
      <td className="px-2 text-right">{totalDisplay}</td>
    </tr>
  )
}
