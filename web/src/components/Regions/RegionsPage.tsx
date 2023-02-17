import React, { Suspense } from 'react'
import { Col, Row } from 'reactstrap'
import { PageHeading } from 'src/components/Common/PageHeading'
import { PageContainer } from 'src/components/Layout/PageContainer'
import { LOADING } from 'src/components/Loading/Loading'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'

export interface RegionsPageProps {
  pathogenName: string
}

export function RegionsPage({ pathogenName }: RegionsPageProps) {
  const { t } = useTranslationSafe()

  return (
    <Suspense fallback={LOADING}>
      <PageContainer>
        <Row noGutters>
          <Col>
            <PageHeading>{t('{{name}}: spread in regions', { name: pathogenName })}</PageHeading>
          </Col>
        </Row>

        <Row noGutters>
          <Col>
            <pre>{JSON.stringify({ pathogenName })}</pre>
          </Col>
        </Row>
      </PageContainer>
    </Suspense>
  )
}
