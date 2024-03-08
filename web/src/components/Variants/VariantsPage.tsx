import React, { useMemo } from 'react'
import { Col, Row } from 'reactstrap'
import styled from 'styled-components'
import { PageContainerHorizontal } from 'src/components/Layout/PageContainer'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { usePathogen, useVariantsDataQuery } from 'src/io/getData'
import { VariantsAndRegionsSidebar } from 'src/components/Sidebar/VariantsAndRegionsSidebar'
import { VariantsPlot } from 'src/components/Variants/VariantsPlot'

export interface VariantsPageProps {
  pathogenName: string
}

export default function VariantsPage({ pathogenName }: VariantsPageProps) {
  const { t } = useTranslationSafe()
  const pathogen = usePathogen(pathogenName)

  const { variants } = useVariantsDataQuery(pathogenName)

  const plots = useMemo(() => {
    return variants.map((variant) => <VariantsPlot key={variant} pathogen={pathogen} variantName={variant} />)
  }, [pathogen, variants])

  return (
    <PageContainerHorizontal>
      <VariantsAndRegionsSidebar pathogenName={pathogenName} />

      <MainContent>
        <MainContentInner>
          <Row noGutters>
            <Col>
              <span className="d-flex w-100 mt-2">
                <h4 className="mx-auto text-center">
                  {t('{{pathogen}} by variant', { pathogen: t(pathogen.nameFriendly) })}
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
