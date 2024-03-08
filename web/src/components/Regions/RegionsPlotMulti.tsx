import React, { Suspense, useCallback, useMemo, useState } from 'react'
import { isArray } from 'lodash-es'
import styled from 'styled-components'
import { Interval } from 'luxon'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { dateToTimestamp, formatDateWeekly, timestampToDate, ymdToTimestamp } from 'src/helpers/format'
import { LocationInfo, Pathogen, useCountries, usePathogen, useRegionDataQuery, useRegions } from 'src/io/getData'
import { DateSlider } from 'src/components/Common/DateSlider'
import { RegionsPlotImpl } from 'src/components/Regions/RegionsPlot'
import { Card, CardBody, CardHeader, Col, Row } from 'reactstrap'
import { LinkSmart } from 'src/components/Link/LinkSmart'
import { ChartContainer, ChartContainerDimensions } from 'src/components/Common/ChartContainer'
import { SPINNER } from 'src/components/Loading/Loading'

const gridSize: 1 | 2 | 3 | 4 = 2 // TODO: make dynamic

export interface RegionsPlotMultiProps {
  pathogen: Pathogen
}

export function RegionsPlotMulti({ pathogen }: RegionsPlotMultiProps) {
  const { minDate, maxDate } = usePathogen(pathogen.name)
  const regionsTranslated = useRegions(pathogen.name)
  const countriesTranslated = useCountries(pathogen.name)

  const locations = useMemo(() => {
    return [...regionsTranslated, ...countriesTranslated]
  }, [countriesTranslated, regionsTranslated])

  const { initialDateRange, marks } = useMemo(() => {
    const minTimestamp = ymdToTimestamp(minDate)
    const maxTimestamp = ymdToTimestamp(maxDate)
    const initialDateRange: [number, number] = [minTimestamp, maxTimestamp]

    const timestamps = Interval.fromDateTimes(
      timestampToDate(minTimestamp).startOf('month'),
      timestampToDate(maxTimestamp).endOf('month'),
    )
      .splitBy({ month: 1 })
      .map((d) => dateToTimestamp(d.start))

    const marks = Object.fromEntries(timestamps.map((timestamp) => [timestamp, formatDateWeekly(timestamp)]))
    return { minTimestamp, maxTimestamp, initialDateRange, marks }
  }, [maxDate, minDate])

  const [dateRange, setDateRange] = useState<[number, number]>(initialDateRange)

  const onDateRangeChange = useCallback((range: [number, number]) => {
    if (isArray(range)) {
      setDateRange(range)
    }
  }, [])

  const plots = useMemo(() => {
    return locations.map((location) => (
      <PlotGridCol key={location.code} sm={12 / gridSize}>
        <PlotGridCard key={location.code} dateRange={dateRange} pathogen={pathogen} location={location} />
      </PlotGridCol>
    ))
  }, [dateRange, locations, pathogen])

  return (
    <>
      <MainContent>
        <MainContentInner>
          <PlotGridRow noGutters>{plots}</PlotGridRow>
        </MainContentInner>
      </MainContent>

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

const PlotGridRow = styled(Row)`
  overflow-y: auto;
`

const PlotGridCol = styled(Col)`
  display: flex;
`

const PlotCard = styled(Card)`
  display: flex;
  flex: 1;
  margin: 0.33rem;
  padding: 0;
  box-shadow: ${(props) => props.theme.shadows.light};
`

const PlotCardHeader = styled(CardHeader)`
  display: flex;
  padding: 0.5rem;
  background: ${(props) => props.theme.gray300};

  h5 {
    color: ${(props) => props.theme.bodyColor};
    text-decoration: none;
  }
`

const PlotCardBody = styled(CardBody)`
  display: flex;
  flex: 1;
  padding: 0;
`

const MainContent = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1 1 100%;
  overflow: hidden;
`

const MainContentInner = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 100%;
  overflow: hidden;
`

function PlotGridCard({
  dateRange,
  pathogen,
  location,
}: {
  dateRange: [number, number]
  pathogen: Pathogen
  location: LocationInfo
}) {
  const { t } = useTranslationSafe()

  const render = useCallback(
    ({ width, height }: ChartContainerDimensions) => (
      <Suspense fallback={SPINNER}>
        <RegionsPlotMultiImpl
          dateRange={dateRange}
          pathogen={pathogen}
          location={location}
          width={width}
          height={height}
        />
      </Suspense>
    ),
    [dateRange, location, pathogen],
  )

  return (
    <PlotCard>
      <LinkSmart className="text-decoration-none" href={`/pathogen/${pathogen.name}/regions/${location.code}`}>
        <PlotCardHeader>
          <h5 className="m-auto">{t(location.name)}</h5>
        </PlotCardHeader>
      </LinkSmart>
      <PlotCardBody>
        <ChartContainer>{render}</ChartContainer>
      </PlotCardBody>
    </PlotCard>
  )
}

function RegionsPlotMultiImpl({
  dateRange,
  pathogen,
  location,
  width,
  height,
}: {
  dateRange: [number, number]
  pathogen: Pathogen
  location: LocationInfo
  width: number
  height: number
}) {
  const { regionData } = useRegionDataQuery(pathogen.name, location.code)

  const { data } = useMemo(() => {
    const data = regionData.values
      .filter(({ date }) => {
        const ts = ymdToTimestamp(date)
        return ts <= dateRange[1] && ts >= dateRange[0]
      })
      .map(({ date, ...rest }) => ({ ...rest, timestamp: ymdToTimestamp(date) }))

    return { data }
  }, [dateRange, regionData.values])

  return (
    <RegionsPlotImpl
      data={data}
      width={width}
      height={height}
      dateRange={dateRange}
      pathogen={pathogen}
      countryName={location.code}
    />
  )
}
