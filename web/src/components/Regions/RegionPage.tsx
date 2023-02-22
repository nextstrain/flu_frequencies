import React, { ReactNode, useMemo } from 'react'
import { Col, Row } from 'reactstrap'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { usePathogen, useRegionsDataQuery } from 'src/io/getData'
import { RegionsPlot } from 'src/components/Regions/RegionsPlot'
import { PageHeading } from 'src/components/Common/PageHeading'
import { PageContainerHorizontal } from 'src/components/Layout/PageContainer'
import { RegionsSidebar } from 'src/components/Regions/RegionsSidebar'
import { Link } from 'src/components/Link/Link'
import urljoin from 'url-join'
import styled from 'styled-components'

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
    let prev: ReactNode = null
    if (i > 0) {
      const prevName = locations[i - 1]
      prev = (
        <Link href={urljoin('pathogen', pathogenName, 'regions', prevName)}>
          {t('Previous: {{name}}', { name: t(prevName) })}
        </Link>
      )
    }
    let next: ReactNode = null
    if (i < locations.length - 1) {
      const nextName = locations[i + 1]
      next = (
        <Link href={urljoin('pathogen', pathogenName, 'regions', nextName)}>
          {t('Next: {{name}}', { name: t(nextName) })}
        </Link>
      )
    }
    return { prev, next }
  }, [pathogenName, t, location, locations])

  return (
    <PageContainerHorizontal>
      <RegionsSidebar pathogenName={pathogenName} />

      <MainContent>
        <Row noGutters>
          <Col>
            <span className="d-flex w-100">
              <span className="mr-auto">{prev}</span>
              <span className="ml-auto">{next}</span>
            </span>
            <PageHeading>
              {t('{{name}} in {{region}}', {
                name: t(pathogen.nameFriendly),
                region: t(location),
              })}
            </PageHeading>
          </Col>
        </Row>

        <Row noGutters>
          <Col>
            <RegionsPlot pathogen={pathogen} countryName={location} />
          </Col>
        </Row>
      </MainContent>
    </PageContainerHorizontal>
  )
}

const MainContent = styled.div`
  flex: 1;
  overflow: hidden;
`
