import React, { useMemo } from 'react'
import { get, isNil, reverse, sortBy, uniqBy } from 'lodash-es'
import type { Props as DefaultTooltipContentProps } from 'recharts/types/component/DefaultTooltipContent'
import { ColoredBox } from 'src/components/Common/ColoredBox'
import { useVariantStyle } from 'src/io/getData'
import styled from 'styled-components'
import { formatDateWeekly } from 'src/helpers/format'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'

const EPSILON = 1e-3

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
  font-size: 1rem;
  font-weight: 600;
  margin: 5px auto;
`

const TooltipTable = styled.table`
  padding: 30px 35px;
  font-size: 0.9rem;
  border: none;
  min-width: 250px;

  background-color: ${(props) => props.theme.plot.tooltip.table.backgroundEven};

  & > tbody > tr:nth-child(odd) {
    background-color: ${(props) => props.theme.plot.tooltip.table.backgroundOdd};
  }
`

// HACK: TODO: this component is not type safe. Typings in `recharts` are broken.
export function RegionsPlotTooltip(props: DefaultTooltipContentProps<number, string>) {
  const { t } = useTranslationSafe()

  const {
    payload,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    metadata: { pathogenName, countryName },
  } = props

  if (!payload || payload.length === 0) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const date = formatDateWeekly(payload[0]?.payload?.timestamp)

  const data = reverse(sortBy(uniqBy(payload, 'name'), 'value'))

  return (
    <Tooltip>
      <TooltipTitle>{date}</TooltipTitle>

      <TooltipTable>
        <thead>
          <tr className="w-100">
            <th className="px-2 text-left">{t('Variant')}</th>
            <th className="px-2 text-right">{t('Frequency')}</th>
            <th className="px-2 text-right">{t('Interval')}</th>
            <th className="px-2 text-right">{t('Count')}</th>
            <th className="px-2 text-right">{t('Total')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ name, payload }) => {
            const variant = name ?? '?'
            const range = get(payload.ranges, variant)
            const value = get(payload.avgs, variant)
            const count = get(payload.counts, variant)
            const total = get(payload.totals, variant)

            return (
              <RegionsPlotTooltipRow
                key={variant}
                pathogenName={pathogenName}
                variant={variant}
                value={value}
                range={range}
                count={count}
                total={total}
              />
            )
          })}
        </tbody>
      </TooltipTable>
    </Tooltip>
  )
}

interface RegionsPlotTooltipRowProps {
  pathogenName: string
  variant: string
  value: number | undefined
  range: [number, number] | undefined
  count: number | undefined
  total: number | undefined
}

function RegionsPlotTooltipRow({ pathogenName, variant, value, range, count, total }: RegionsPlotTooltipRowProps) {
  const { color } = useVariantStyle(pathogenName, variant)

  const valueDisplay = useMemo(() => {
    if (!isNil(value)) {
      if (value > EPSILON) {
        return value.toFixed(3)
      }
      return `<${EPSILON}`
    }
    return '-'
  }, [value])

  const rangeDisplay = useMemo(() => {
    if (!isNil(range)) {
      return `${range[0].toFixed(3)}..${range[1].toFixed(3)}`
    }
    return null
  }, [range])

  return (
    <tr key={variant}>
      <td className="px-2 text-left">
        <ColoredBox $size={16} $color={color} />
        <span className="ml-2">{variant}</span>
      </td>
      <td className="px-2 text-right">{valueDisplay}</td>
      <td className="px-2 text-right">{rangeDisplay}</td>
      <td className="px-2 text-right">{count}</td>
      <td className="px-2 text-right">{total}</td>
    </tr>
  )
}
