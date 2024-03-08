import React, { useCallback, useMemo, useState } from 'react'
import { isArray } from 'lodash-es'
import { useResizeDetector } from 'react-resize-detector'
import styled from 'styled-components'
import { Interval } from 'luxon'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { dateToTimestamp, formatDateWeekly, timestampToDate, ymdToTimestamp } from 'src/helpers/format'
import { Pathogen, useCountries, usePathogen, useRegionDataQuery, useRegions } from 'src/io/getData'
import { DateSlider } from 'src/components/Common/DateSlider'
import { RegionsPlotImpl } from 'src/components/Regions/RegionsPlot'
import { Card, CardBody, CardHeader, Col, Row } from 'reactstrap'
import { LinkSmart } from 'src/components/Link/LinkSmart'

export interface RegionsPlotMultiProps {
  pathogen: Pathogen
}

export function RegionsPlotMulti({ pathogen }: RegionsPlotMultiProps) {
  const { t } = useTranslationSafe()

  const gridSize: 1 | 2 | 3 | 4 = 2

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

  return (
    <>
      <MainContent>
        <MainContentInner>
          <PlotGridRow noGutters>
            {locations.slice(0, 15).map((location) => (
              <PlotGridCol key={location.code} sm={12 / gridSize}>
                <PlotCard>
                  <LinkSmart
                    className="text-decoration-none"
                    href={`/pathogen/${pathogen.name}/regions/${location.code}`}
                  >
                    <PlotCardHeader>
                      <h5 className="m-auto">{t(location.name)}</h5>
                    </PlotCardHeader>
                  </LinkSmart>
                  <PlotCardBody>
                    <RegionsPlotMultiImpl dateRange={dateRange} pathogen={pathogen} countryName={location.code} />
                  </PlotCardBody>
                </PlotCard>
              </PlotGridCol>
            ))}
          </PlotGridRow>
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
  aspect-ratio: 1;
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

function RegionsPlotMultiImpl({
  dateRange,
  pathogen,
  countryName,
}: {
  dateRange: [number, number]
  pathogen: Pathogen
  countryName: string
}) {
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

  const { regionData } = useRegionDataQuery(pathogen.name, countryName)

  const { data } = useMemo(() => {
    // subset data (avgs, counts, date, ranges, totals) to date range
    const data = regionData.values
      .filter(({ date }) => {
        const ts = ymdToTimestamp(date)
        return ts <= dateRange[1] && ts >= dateRange[0]
      })
      .map(({ date, ...rest }) => ({ ...rest, timestamp: ymdToTimestamp(date) }))

    return { data }
  }, [dateRange, regionData.values])

  return (
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
  )
}

const PlotWrapper = styled.div`
  flex: 1;
  width: 100%;
  height: 100%;
`
