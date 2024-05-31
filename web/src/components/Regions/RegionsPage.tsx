import React from 'react'
import { Col, Row } from 'reactstrap'
import styled from 'styled-components'
import { PageContainerHorizontal } from 'src/components/Layout/PageContainer'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { usePathogen } from 'src/io/getData'
import { VariantsAndRegionsSidebar } from 'src/components/Sidebar/VariantsAndRegionsSidebar'
import { RegionsPlotMulti } from 'src/components/Regions/RegionsPlotMulti'

export interface RegionsPageProps {
  pathogenName: string
}

export default function RegionsPage({ pathogenName }: RegionsPageProps) {
  const { t } = useTranslationSafe()
  const pathogen = usePathogen(pathogenName)

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

          <RegionsPlotMulti pathogen={pathogen} />
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
