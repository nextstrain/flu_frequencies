import React from 'react'
import { Col, Container, Row } from 'reactstrap'
import { PageHeading } from 'src/components/Common/PageHeading'
import { VariantsPlot } from 'src/components/Variants/VariantsPlot'
import { VariantsSidebar } from 'src/components/Variants/VariantsSidebar'
import { PageContainerHorizontal, PageMainWrapper } from 'src/components/Layout/PageContainer'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { usePathogen, useVariantsDataQuery } from 'src/io/getData'

export interface VariantsPageProps {
  pathogenName: string
  variant: string
}

export function VariantsPage({ pathogenName, variant }: VariantsPageProps) {
  const { t } = useTranslationSafe()
  const pathogen = usePathogen(pathogenName)
  const { variants } = useVariantsDataQuery(pathogen.name)

  return (
    <PageContainerHorizontal>
      <VariantsSidebar pathogenName={pathogenName} />

      <PageMainWrapper>
        <Row noGutters>
          <Col>
            <PageHeading>{t('{{name}}: variants', { name: t(pathogen.nameFriendly) })}</PageHeading>
          </Col>
        </Row>
        <Row noGutters>
          <Col>
            <Container fluid>
              {variants.map((variant) => (
                <Row key={variant} noGutters className="mb-5">
                  <Col>
                    <h3 className="text-center">{variant}</h3>
                    <VariantsPlot pathogenName={pathogenName} variantName={variant} />
                  </Col>
                </Row>
              ))}
            </Container>
          </Col>
        </Row>
      </PageMainWrapper>
    </PageContainerHorizontal>
  )
}
