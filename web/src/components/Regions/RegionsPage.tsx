import React, { useMemo } from 'react'
import { Col, Row } from 'reactstrap'
import styled from 'styled-components'
import { PageContainerHorizontal } from 'src/components/Layout/PageContainer'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { useCountries, usePathogen, useRegions } from 'src/io/getData'
import { VariantsAndRegionsSidebar } from 'src/components/Sidebar/VariantsAndRegionsSidebar'
import { RegionsPlot } from 'src/components/Regions/RegionsPlot'

export interface RegionsPageProps {
  pathogenName: string
}

export function RegionsPage({ pathogenName }: RegionsPageProps) {
  const { t } = useTranslationSafe()
  const pathogen = usePathogen(pathogenName)

  const regionsTranslated = useRegions(pathogenName)
  const countriesTranslated = useCountries(pathogenName)

  const plots = useMemo(() => {
    return [...regionsTranslated, ...countriesTranslated].map((location) => (
      <RegionsPlot key={location.code} pathogen={pathogen} countryName={location.code} />
    ))
  }, [countriesTranslated, pathogen, regionsTranslated])

  return (
    <PageContainerHorizontal>
      <VariantsAndRegionsSidebar pathogenName={pathogenName} />

      <MainContent>
        <MainContentInner>
          <Row noGutters>
            <Col>
              <span className="d-flex w-100 mt-2">
                <h4 className="mx-auto text-center">
                  {t('{{pathogen}} by region', { pathogen: t(pathogen.nameFriendly) })}
                </h4>
              </span>
            </Col>
          </Row>

          {plots}
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
