import { get, maxBy, minBy } from 'lodash'
import { Interval } from 'luxon'
import React, { useMemo } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { ChartContainer } from 'src/components/Charts/ChartContainer'
import { VariantsPlotTooltip } from 'src/components/Variants/VariantsPlotTooltip'
import { adjustTicks } from 'src/helpers/adjustTicks'
import { dateFromYmd, formatDateHumanely, formatProportion, ymdToTimestamp } from 'src/helpers/format'
import { getCountryColor, getCountryStrokeDashArray, Pathogen, useVariantDataQuery, VariantDatum } from 'src/io/getData'
import { useTheme } from 'styled-components'

export function calculateTicks(data: VariantDatum[], availableWidth: number, tickWidth: number) {
  if (data.length === 0) {
    return { adjustedTicks: [], domainX: [0, 0], domainY: [0, 0] }
  }

  const minDate = minBy(data, (d) => d.date)!.date // eslint-disable-line @typescript-eslint/no-non-null-assertion
  const maxDate = maxBy(data, (d) => d.date)!.date // eslint-disable-line @typescript-eslint/no-non-null-assertion

  const start = dateFromYmd(minDate)
  const end = dateFromYmd(maxDate)

  const ticks = Interval.fromDateTimes(start.startOf('month'), end.endOf('month'))
    .splitBy({ months: 1 })
    .map((d) => d.start.toSeconds())

  const adjustedTicks = adjustTicks(ticks, availableWidth, tickWidth)
  const domainX = [adjustedTicks[0], end.toSeconds()]
  const domainY = [0, 1]
  return { adjustedTicks, domainX, domainY }
}

const allowEscapeViewBox = { x: false, y: true }
const tooltipStyle = { zIndex: 1000, outline: 'none' }

// TODO
const shouldPlotRanges = false

interface LinePlotProps {
  width: number
  height: number
  pathogen: Pathogen
  variantName: string
}

function LinePlot({ width, height, pathogen, variantName }: LinePlotProps) {
  const theme = useTheme()
  const {
    variantData,
    regionsData: { regions, countries, regionsStyles },
  } = useVariantDataQuery(pathogen.name, variantName)

  const data = useMemo(
    () =>
      variantData.values.map(({ date, ...rest }) => {
        const timestamp = ymdToTimestamp(date)
        return { timestamp, ...rest }
      }),
    [variantData.values],
  )

  const { adjustedTicks, domainX, domainY } = useMemo(
    () => calculateTicks(variantData.values, width ?? 0, theme.plot.tickWidthMin),
    [theme.plot.tickWidthMin, variantData.values, width],
  )

  const lines = useMemo(() => {
    return [...regions, ...countries].map((country) => (
      <Line
        key={`line-${country}`}
        type="monotone"
        name={country}
        dataKey={(d) => get(d.avgs, country)} // eslint-disable-line react-perf/jsx-no-new-function-as-prop
        stroke={getCountryColor(regionsStyles, country)}
        strokeWidth={2}
        strokeDasharray={getCountryStrokeDashArray(regionsStyles, country)}
        dot={false}
        isAnimationActive={false}
      />
    ))
  }, [countries, regions, regionsStyles])

  const ranges = useMemo(() => {
    if (!shouldPlotRanges) {
      return null
    }

    return [...regions, ...countries].map((country) => (
      <Area
        key={`area-${country}`}
        dataKey={(d) => get(d.ranges, country)} // eslint-disable-line react-perf/jsx-no-new-function-as-prop
        stroke="none"
        fill={getCountryColor(regionsStyles, country)}
        fillOpacity={0.1}
        isAnimationActive={false}
      />
    ))
  }, [countries, regions, regionsStyles])

  const metadata = useMemo(() => ({ pathogenName: pathogen.name, variantName }), [pathogen.name, variantName])

  return (
    <ComposedChart width={width} height={height} margin={theme.plot.margin} data={data}>
      <XAxis
        dataKey="timestamp"
        type="number"
        tickFormatter={formatDateHumanely}
        domain={domainX}
        ticks={adjustedTicks}
        tick={theme.plot.tickStyle}
        tickMargin={theme.plot.tickMargin?.x}
        allowDataOverflow
      />
      <YAxis
        type="number"
        tickFormatter={formatProportion}
        domain={domainY}
        tick={theme.plot.tickStyle}
        tickMargin={theme.plot.tickMargin?.y}
        allowDataOverflow
      />
      <RechartsTooltip
        content={VariantsPlotTooltip}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        metadata={metadata}
        isAnimationActive={false}
        allowEscapeViewBox={allowEscapeViewBox}
        offset={50}
        wrapperStyle={tooltipStyle}
      />
      <CartesianGrid stroke="#2222" />
      {lines}
      {ranges}
    </ComposedChart>
  )
}

export interface VariantsPlotProps {
  pathogen: Pathogen
  variantName: string
}

export function VariantsPlot({ pathogen, variantName }: VariantsPlotProps) {
  return (
    <ChartContainer>
      {({ width, height }) => <LinePlot width={width} height={height} pathogen={pathogen} variantName={variantName} />}
    </ChartContainer>
  )
}
