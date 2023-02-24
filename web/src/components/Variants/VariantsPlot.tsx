import React, { useCallback, useMemo, useState } from 'react'
import { get, isArray, max, min } from 'lodash-es'
import { DateTime } from 'luxon'
import { useRecoilValue } from 'recoil'
import { useResizeDetector } from 'react-resize-detector'
import styled, { useTheme } from 'styled-components'
import { Area, CartesianGrid, ComposedChart, Line, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import {
  formatDateHumanely,
  formatDateWeekly,
  formatProportion,
  timestampToDate,
  ymdToTimestamp,
} from 'src/helpers/format'
import { calculateTicks } from 'src/helpers/adjustTicks'
import { getCountryColor, getCountryStrokeDashArray, Pathogen, useVariantDataQuery } from 'src/io/getData'
import { continentsAtom, countriesAtom } from 'src/state/geography.state'
import { shouldShowRangesOnVariantsPlotAtom } from 'src/state/settings.state'
import { VariantsPlotTooltip } from 'src/components/Variants/VariantsPlotTooltip'
import { DateSlider } from 'src/components/Common/DateSlider'

const allowEscapeViewBox = { x: false, y: true }
const tooltipStyle = { zIndex: 1000, outline: 'none' }

interface LinePlotProps<T> {
  data: T[]
  minDate: DateTime
  maxDate: DateTime
  width: number
  height: number
  pathogen: Pathogen
  variantName: string
}

function LinePlot<T>({ width, height, data, minDate, maxDate, pathogen, variantName }: LinePlotProps<T>) {
  const theme = useTheme()
  const shouldShowRanges = useRecoilValue(shouldShowRangesOnVariantsPlotAtom)
  const regions = useRecoilValue(continentsAtom(pathogen.name))
  const countries = useRecoilValue(countriesAtom(pathogen.name))
  const {
    regionsData: { geographyStyles },
  } = useVariantDataQuery(pathogen.name, variantName)

  const { adjustedTicks, domainX, domainY } = useMemo(
    () => calculateTicks(minDate, maxDate, width ?? 0, theme.plot.tickWidthMin),
    [maxDate, minDate, theme.plot.tickWidthMin, width],
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
        style={theme.plot.axes.x}
        allowDataOverflow
      />
      <YAxis
        type="number"
        tickFormatter={formatProportion}
        domain={domainY}
        tick={theme.plot.tickStyle}
        tickMargin={theme.plot.tickMargin?.y}
        style={theme.plot.axes.y}
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
      <CartesianGrid stroke={theme.plot.cartesianGrid.stroke} />
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
  const { variantData } = useVariantDataQuery(pathogen.name, variantName)

  const { minTimestamp, maxTimestamp, initialTimestampRange, marks } = useMemo(() => {
    const timestamps = variantData.values.map(({ date }) => ymdToTimestamp(date))
    const minTimestamp = min(timestamps) ?? 0
    const maxTimestamp = max(timestamps) ?? 0
    const initialTimestampRange = [minTimestamp, maxTimestamp]
    const marks = Object.fromEntries(timestamps.map((timestamp) => [timestamp, formatDateWeekly(timestamp)]))
    return { minTimestamp, maxTimestamp, initialTimestampRange, marks }
  }, [variantData.values])

  const [dateRange, setDateRange] = useState(initialTimestampRange)

  const onDateRangeChange = useCallback((range: number | number[]) => {
    if (isArray(range)) {
      setDateRange(range)
    }
  }, [])

  const { data, minDate, maxDate } = useMemo(() => {
    const data = variantData.values
      .filter(({ date }) => {
        const ts = ymdToTimestamp(date)
        return ts <= dateRange[1] && ts >= dateRange[0]
      })
      .map(({ date, ...rest }) => ({ ...rest, timestamp: ymdToTimestamp(date) }))

    const minDate = timestampToDate(dateRange[0])
    const maxDate = timestampToDate(dateRange[1])

    return { data, minDate, maxDate }
  }, [dateRange, variantData.values])

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
    <>
      <PlotWrapper ref={resizeRef}>
        <LinePlot
          data={data}
          width={width}
          height={height}
          minDate={minDate}
          maxDate={maxDate}
          pathogen={pathogen}
          variantName={variantName}
        />
      </PlotWrapper>

      <DateSlider
        minTimestamp={minTimestamp}
        maxTimestamp={maxTimestamp}
        initialTimestampRange={initialTimestampRange}
        marks={marks}
        onDateRangeChange={onDateRangeChange}
      />
    </>
  )
}

const PlotWrapper = styled.div`
  flex: 1;
`
