import React, { useMemo } from 'react'
import { Col, Row } from 'reactstrap'
import urljoin from 'url-join'
import styled from 'styled-components'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { usePathogen, useRegionsDataQuery } from 'src/io/getData'
import { RegionsPlot } from 'src/components/Regions/RegionsPlot'
import { PageContainerHorizontal } from 'src/components/Layout/PageContainer'
import { RegionsSidebar } from 'src/components/Regions/RegionsSidebar'
import { LinkButtonNext, LinkButtonPrev } from 'src/components/Common/LinkButtonNextPrev'

export interface RegionsPageProps {
  pathogenName: string
  location: string
}

export function RegionPage({ pathogenName, location }: RegionsPageProps) {
  const { t } = useTranslationSafe()
  const pathogen = usePathogen(pathogenName)
  const { regions, countries } = useRegionsDataQuery(pathogen.name)
  const locations = useMemo(() => [...regions, ...countries], [countries, regions])

  const { prev, next } = useMemo(() => {
    const i = locations.indexOf(location)
    const prevName = locations[i - 1] ?? locations[locations.length - 1]
    const prev = <LinkButtonPrev text={t(prevName)} href={urljoin('pathogen', pathogenName, 'regions', prevName)} />
    const nextName = locations[i + 1] ?? locations[0]
    const next = <LinkButtonNext text={t(nextName)} href={urljoin('pathogen', pathogenName, 'regions', nextName)} />
    return { prev, next }
  }, [locations, location, t, pathogenName])

  return (
    <PageContainerHorizontal>
      <RegionsSidebar pathogenName={pathogenName} />

      <MainContent>
        <MainContentInner>
          <Row noGutters>
            <Col>
              <span className="d-flex w-100 mt-2">
                <span className="ml-2 mr-auto">{prev}</span>
                <h4 className="text-center">
                  {t('{{pathogen}}, {{region}}', {
                    pathogen: t(pathogen.nameFriendly),
                    region: t(location),
                  })}
                </h4>
                <span className="mr-2 ml-auto">{next}</span>
              </span>
            </Col>
          </Row>

          <RegionsPlot pathogen={pathogen} countryName={location} />
        </MainContentInner>
      </MainContent>
    </PageContainerHorizontal>
  )
}

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
