import React, { useMemo } from 'react'
import { isNil, reverse, sortBy, uniqBy } from 'lodash'
import type { Props as DefaultTooltipContentProps } from 'recharts/types/component/DefaultTooltipContent'
import { useCountryStyle } from 'src/io/getData'
import styled from 'styled-components'
import { theme } from 'src/theme'
import { formatDateWeekly } from 'src/helpers/format'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { ColoredHorizontalLineIcon } from 'src/components/Common/ColoredHorizontalLineIcon'

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
export function VariantsPlotTooltip(props: DefaultTooltipContentProps<number, string>) {
  const { t } = useTranslationSafe()

  const {
    payload,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    metadata: { pathogenName, variantName },
  } = props

  if (!payload || payload.length === 0) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const data = payload[0]?.payload

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const date = formatDateWeekly(data?.timestamp)

  const payloadSorted = reverse(sortBy(payload, 'value'))
  const payloadUnique = uniqBy(payloadSorted, (payload) => payload.name)

  return (
    <Tooltip>
      <TooltipTitle>{variantName}</TooltipTitle>
      <TooltipTitle>{date}</TooltipTitle>

      <TooltipTable>
        <thead>
          <tr className="w-100">
            <th className="px-2 text-left">{t('Country')}</th>
            <th className="px-2 text-right">{t('Frequency')}</th>
          </tr>
        </thead>
        <tbody>
          {payloadUnique.map(({ name, value, payload: _0 }) => {
            const country = name ?? '?'
            return <VariantsPlotTooltipRow key={country} pathogenName={pathogenName} country={country} value={value} />
          })}
        </tbody>
      </TooltipTable>
    </Tooltip>
  )
}

interface VariantsPlotTooltipRowProps {
  pathogenName: string
  country: string
  value: number | undefined
}

function VariantsPlotTooltipRow({ pathogenName, country, value }: VariantsPlotTooltipRowProps) {
  const { t } = useTranslationSafe()
  const { color, strokeDashArray } = useCountryStyle(pathogenName, country)

  const valueDisplay = useMemo(() => {
    if (!isNil(value)) {
      if (value > EPSILON) {
        return value.toFixed(3)
      }
      return `<${EPSILON}`
    }
    return '-'
  }, [value])

  return (
    <tr key={country}>
      <td className="px-2 text-left">
        <ColoredHorizontalLineIcon
          width={theme.plot.country.legend.lineIcon.width}
          height={theme.plot.country.legend.lineIcon.height}
          stroke={color}
          strokeWidth={theme.plot.country.legend.lineIcon.thickness}
          strokeDasharray={strokeDashArray}
        />
        <span className="ml-2">{t(country)}</span>
      </td>
      <td className="px-2 text-right">{valueDisplay}</td>
    </tr>
  )
}
