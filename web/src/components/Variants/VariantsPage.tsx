import React, { Suspense } from 'react'
import { Col, Container, Row } from 'reactstrap'
import { usePathogenQuery } from 'src/io/getData'
import urljoin from 'url-join'
import { PageHeading } from 'src/components/Common/PageHeading'
import { PageContainer } from 'src/components/Layout/PageContainer'
import { LOADING } from 'src/components/Loading/Loading'
import { VariantsPlot } from 'src/components/Variants/VariantsPlot'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { useAxiosQuery } from 'src/hooks/useAxiosQuery'
import { getDataRootUrl } from 'src/io/getDataRootUrl'

export interface VariantsJson {
  variants: string[]
}

export function useVariantsDataQuery(pathogenName: string): VariantsJson {
  return useAxiosQuery(urljoin(getDataRootUrl(), 'pathogens', pathogenName, 'variants.json'))
}

export interface VariantsPageProps {
  pathogenName: string
}

export function VariantsPage({ pathogenName }: VariantsPageProps) {
  const { t } = useTranslationSafe()
  const pathogen = usePathogenQuery(pathogenName)
  const { variants } = useVariantsDataQuery(pathogenName)

  return (
    <Suspense fallback={LOADING}>
      <PageContainer>
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
                    <VariantsPlot pathogen={pathogen} variantName={variant} />
                  </Col>
                </Row>
              ))}
            </Container>
          </Col>
        </Row>
      </PageContainer>
    </Suspense>
  )
}
