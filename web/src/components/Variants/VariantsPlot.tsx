import { get, maxBy, minBy } from 'lodash-es'
import { Interval } from 'luxon'
import React, { useMemo } from 'react'
import styled, { useTheme } from 'styled-components'
import { useResizeDetector } from 'react-resize-detector'
import { Area, CartesianGrid, ComposedChart, Line, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { useRecoilValue } from 'recoil'
import { VariantsPlotTooltip } from 'src/components/Variants/VariantsPlotTooltip'
import { adjustTicks } from 'src/helpers/adjustTicks'
import { dateFromYmd, formatDateHumanely, formatProportion, ymdToTimestamp } from 'src/helpers/format'
import {
  getCountryColor,
  getCountryStrokeDashArray,
  usePathogen,
  useVariantDataQuery,
  VariantDatum,
} from 'src/io/getData'
import { continentsAtom, countriesAtom } from 'src/state/geography.state'
import { shouldShowRangesOnVariantsPlotAtom } from 'src/state/settings.state'

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

interface LinePlotProps {
  width: number
  height: number
  pathogenName: string
  variantName: string
}

function LinePlot({ width, height, pathogenName, variantName }: LinePlotProps) {
  const theme = useTheme()
  const pathogen = usePathogen(pathogenName)
  const shouldShowRanges = useRecoilValue(shouldShowRangesOnVariantsPlotAtom)
  const regions = useRecoilValue(continentsAtom(pathogen.name))
  const countries = useRecoilValue(countriesAtom(pathogen.name))

  const {
    variantData,
    regionsData: { geographyStyles },
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

  const { lines, ranges } = useMemo(() => {
    const locations = [...regions, ...countries]

    const lines = locations
      .map(
        ({ name, enabled }) =>
          enabled && (
            <Line
              key={`line-${name}`}
              type="monotone"
              name={name}
              dataKey={(d) => get(d.avgs, name)} // eslint-disable-line react-perf/jsx-no-new-function-as-prop
              stroke={getCountryColor(geographyStyles, name)}
              strokeWidth={2}
              strokeDasharray={getCountryStrokeDashArray(geographyStyles, name)}
              dot={false}
              isAnimationActive={false}
            />
          ),
      )
      .filter(Boolean)

    const ranges = locations
      .map(
        ({ name, enabled }) =>
          enabled && (
            <Area
              key={`area-${name}`}
              name={name}
              dataKey={(d) => get(d.ranges, name)} // eslint-disable-line react-perf/jsx-no-new-function-as-prop
              stroke="none"
              fill={getCountryColor(geographyStyles, name)}
              fillOpacity={0.1}
              isAnimationActive={false}
              display={!shouldShowRanges ? 'none' : undefined}
            />
          ),
      )
      .filter(Boolean)

    return { lines, ranges }
  }, [regions, countries, geographyStyles, shouldShowRanges])

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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        content={VariantsPlotTooltip}
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
  pathogenName: string
  variantName: string
}

export function VariantsPlot({ pathogenName, variantName }: VariantsPlotProps) {
  const {
    width = 0,
    height = 0,
    ref: resizeRef,
  } = useResizeDetector({
    handleWidth: true,
    handleHeight: true,
    refreshRate: 300,
    refreshMode: 'debounce',
  })

  return (
    <PlotWrapper ref={resizeRef}>
      <LinePlot width={width} height={height} pathogenName={pathogenName} variantName={variantName} />
    </PlotWrapper>
  )
}

const PlotWrapper = styled.div`
  flex: 1;
`
