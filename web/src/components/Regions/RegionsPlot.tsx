import { get, maxBy, minBy } from 'lodash-es'
import { Interval } from 'luxon'
import React, { useMemo } from 'react'
import { useRecoilValue } from 'recoil'
import { shouldShowRangesOnRegionsPlotAtom } from 'src/state/settings.state'
import { variantsAtom } from 'src/state/variants.state'
import { useTheme } from 'styled-components'
import { Area, CartesianGrid, ComposedChart, Line, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { adjustTicks } from 'src/helpers/adjustTicks'
import { dateFromYmd, formatDateHumanely, formatProportion, ymdToTimestamp } from 'src/helpers/format'
import { getCountryColor, getCountryStrokeDashArray, Pathogen, RegionDatum, useRegionDataQuery } from 'src/io/getData'
import { ChartContainer } from 'src/components/Charts/ChartContainer'
import { RegionsPlotTooltip } from 'src/components/Regions/RegionsPlotTooltip'

export function calculateTicks(data: RegionDatum[], availableWidth: number, tickWidth: number) {
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
  pathogen: Pathogen
  countryName: string
}

function RegionsPlotImpl({ width, height, pathogen, countryName }: LinePlotProps) {
  const theme = useTheme()
  const shouldShowRanges = useRecoilValue(shouldShowRangesOnRegionsPlotAtom)
  const variants = useRecoilValue(variantsAtom(pathogen.name))
  const {
    regionData,
    variantsData: { variantsStyles },
  } = useRegionDataQuery(pathogen.name, countryName)

  const data = useMemo(
    () =>
      regionData.values.map(({ date, ...rest }) => {
        const timestamp = ymdToTimestamp(date)
        return { timestamp, ...rest }
      }),
    [regionData.values],
  )

  const { adjustedTicks, domainX, domainY } = useMemo(
    () => calculateTicks(regionData.values, width ?? 0, theme.plot.tickWidthMin),
    [regionData.values, theme.plot.tickWidthMin, width],
  )

  const { lines, ranges } = useMemo(() => {
    const lines = variants
      .map(
        ({ name, enabled }) =>
          enabled && (
            <Line
              key={`line-${name}`}
              type="monotone"
              name={name}
              dataKey={(d) => get(d.avgs, name)} // eslint-disable-line react-perf/jsx-no-new-function-as-prop
              stroke={getCountryColor(variantsStyles, name)}
              strokeWidth={2}
              strokeDasharray={getCountryStrokeDashArray(variantsStyles, name)}
              dot={false}
              isAnimationActive={false}
            />
          ),
      )
      .filter(Boolean)

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
              display={!shouldShowRanges ? 'none' : undefined}
            />
          ),
      )
      .filter(Boolean)

    return { lines, ranges }
  }, [shouldShowRanges, variants, variantsStyles])

  const metadata = useMemo(() => ({ pathogenName: pathogen.name, countryName }), [countryName, pathogen.name])

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
        content={RegionsPlotTooltip}
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

export interface RegionsPlotProps {
  pathogen: Pathogen
  countryName: string
}

export function RegionsPlot({ pathogen, countryName }: RegionsPlotProps) {
  return (
    <ChartContainer>
      {({ width, height }) => (
        <RegionsPlotImpl width={width} height={height} pathogen={pathogen} countryName={countryName} />
      )}
    </ChartContainer>
  )
}
