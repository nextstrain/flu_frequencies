import React, { useCallback, useMemo, useState } from 'react'
import { get, isArray, max, min } from 'lodash-es'
import { useRecoilValue } from 'recoil'
import { useResizeDetector } from 'react-resize-detector'
import styled, { useTheme } from 'styled-components'
import { Area, CartesianGrid, ComposedChart, Line, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { formatDateHumanely, formatDateWeekly, formatProportion, ymdToTimestamp } from 'src/helpers/format'
import { calculateTicks } from 'src/helpers/adjustTicks'
import { getCountryColor, getCountryStrokeDashArray, Pathogen, RegionDatum, useRegionDataQuery } from 'src/io/getData'
import { shouldShowDotsOnRegionsPlotAtom, shouldShowRangesOnRegionsPlotAtom } from 'src/state/settings.state'
import { variantsAtom } from 'src/state/variants.state'
import { RegionsPlotTooltip } from 'src/components/Regions/RegionsPlotTooltip'
import { CustomizedDot, CustomizedActiveDot } from 'src/components/Common/CustomPlotDots'
import { DateSlider } from 'src/components/Common/DateSlider'
import { localeAtom } from 'src/state/locale.state'

const allowEscapeViewBox = { x: false, y: false }
const tooltipStyle = { zIndex: 1000, outline: 'none' }

export interface LinePlotProps<T> {
  data: T[]
  dateRange: [number, number]
  width: number
  height: number
  pathogen: Pathogen
  countryName: string
}

export function RegionsPlotImpl<T>({ width, height, data, dateRange, pathogen, countryName }: LinePlotProps<T>) {
  const theme = useTheme()
  const locale = useRecoilValue(localeAtom)
  const shouldShowRanges = useRecoilValue(shouldShowRangesOnRegionsPlotAtom)
  const shouldShowDots = useRecoilValue(shouldShowDotsOnRegionsPlotAtom)
  const variants = useRecoilValue(variantsAtom(pathogen.name)) // name, color and lineStyle
  const {
    variantsData: { variantsStyles },
  } = useRegionDataQuery(pathogen.name, countryName)

  const { adjustedTicks, domainX, domainY } = useMemo(
    () => calculateTicks(dateRange, width ?? 0, theme.plot.tickWidthMin),
    [dateRange, theme.plot.tickWidthMin, width],
  )

  const { lines, ranges } = useMemo(() => {
    // draw trendlines
    const lines = variants
      .map(
        ({ name, enabled }) =>
          enabled && (
            <Line
              key={`line-${name}`}
              type="linear"
              name={name} // variant name
              dataKey={(d) => get(d.avgs, name)} // eslint-disable-line react-perf/jsx-no-new-function-as-prop
              stroke={getCountryColor(variantsStyles, name)}
              strokeWidth={theme.plot.line.strokeWidth}
              strokeDasharray={getCountryStrokeDashArray(variantsStyles, name)}
              // HACK: this is not type safe. These components rely on props, which are not included in Recharts typings
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              dot={shouldShowDots ? <CustomizedDot /> : false} // eslint-disable-line react-perf/jsx-no-jsx-as-prop
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              activeDot={<CustomizedActiveDot name={name} shouldShowDots={shouldShowDots} />} // eslint-disable-line react-perf/jsx-no-jsx-as-prop
              isAnimationActive={false}
            />
          ),
      )
      .filter(Boolean)

    // confidence intervals as shaded polygons
    const ranges = variants
      .map(
        ({ name, enabled }) =>
          enabled && (
            <Area
              key={`area-${name}`}
              name={name}
              dataKey={(d) => get(d.ranges, name)} // eslint-disable-line react-perf/jsx-no-new-function-as-prop
              stroke="none"
              fill={getCountryColor(variantsStyles, name)}
              fillOpacity={0.1}
              isAnimationActive={false}
              activeDot={false}
              display={!shouldShowRanges ? 'none' : undefined}
            />
          ),
      )
      .filter(Boolean)

    return { lines, ranges }
  }, [shouldShowRanges, shouldShowDots, theme.plot.line.strokeWidth, variants, variantsStyles])

  const metadata = useMemo(() => ({ pathogenName: pathogen.name, countryName }), [countryName, pathogen.name])

  return (
    <ComposedChart width={width} height={height} margin={theme.plot.margin} data={data}>
      <XAxis
        dataKey="timestamp"
        type="number"
        tickFormatter={formatDateHumanely(locale)}
        domain={domainX}
        ticks={adjustedTicks}
        tick={theme.plot.tickStyle}
        tickMargin={theme.plot.tickMargin?.x}
        style={theme.plot.axes.x}
        allowDataOverflow
      />
      <YAxis
        type="number"
        tickFormatter={formatProportion(locale)}
        domain={domainY}
        tick={theme.plot.tickStyle}
        tickMargin={theme.plot.tickMargin?.y}
        style={theme.plot.axes.y}
        allowDataOverflow
      />
      <RechartsTooltip
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        content={RegionsPlotTooltip}
        metadata={metadata}
        isAnimationActive
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

export interface RegionsPlotProps {
  pathogen: Pathogen
  countryName: string
}

export function RegionsPlot({ pathogen, countryName }: RegionsPlotProps) {
  const { data, dateRange, initialDateRange, marks, onDateRangeChange } = useRegionPlotData(pathogen, countryName)

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
        <RegionsPlotImpl
          data={data}
          width={width}
          height={height}
          dateRange={dateRange}
          pathogen={pathogen}
          countryName={countryName}
        />
      </PlotWrapper>

      <DateSlider
        range={dateRange}
        fullRange={initialDateRange}
        initialRange={initialDateRange}
        marks={marks}
        onDateRangeChange={onDateRangeChange}
      />
    </>
  )
}

const PlotWrapper = styled.div`
  flex: 1;
`

export interface RegionPlotData {
  data: (RegionDatum & { timestamp: number })[]
  dateRange: [number, number]
  initialDateRange: [number, number]
  marks: Record<number, string>
  onDateRangeChange: (dateRange: [number, number]) => void
}

export function useRegionPlotData(pathogen: Pathogen, location: string): RegionPlotData {
  const { regionData } = useRegionDataQuery(pathogen.name, location)

  const { initialDateRange, marks } = useMemo(() => {
    const timestamps = regionData.values.map(({ date }) => ymdToTimestamp(date))
    const minTimestamp = min(timestamps) ?? 0
    const maxTimestamp = max(timestamps) ?? 0
    const initialDateRange: [number, number] = [minTimestamp, maxTimestamp]
    const marks = Object.fromEntries(timestamps.map((timestamp) => [timestamp, formatDateWeekly(timestamp)]))
    return { initialDateRange, marks }
  }, [regionData.values])

  const [dateRange, setDateRange] = useState(initialDateRange)

  const onDateRangeChange = useCallback((range: [number, number]) => {
    if (isArray(range)) {
      setDateRange(range)
    }
  }, [])

  const { data } = useMemo(() => {
    // subset data (avgs, counts, date, ranges, totals) to date range
    const data = regionData.values
      .filter(({ date }) => {
        const ts = ymdToTimestamp(date)
        return ts <= dateRange[1] && ts >= dateRange[0]
      })
      .map(({ date, ...rest }) => ({ date, ...rest, timestamp: ymdToTimestamp(date) }))
    return { data }
  }, [dateRange, regionData.values])

  return useMemo(
    () => ({
      data,
      dateRange,
      initialDateRange,
      marks,
      onDateRangeChange,
    }),
    [data, dateRange, initialDateRange, marks, onDateRangeChange],
  )
}
