import React, { Suspense } from 'react'
import { Col, Row } from 'reactstrap'
import { PageHeading } from 'src/components/Common/PageHeading'
import { PageContainerNarrow } from 'src/components/Layout/PageContainer'
import { LOADING } from 'src/components/Loading/Loading'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'

export interface PathogenPageProps {
  pathogenName: string
}

export function PathogenPage({ pathogenName }: PathogenPageProps) {
  const { t } = useTranslationSafe()

  return (
    <Suspense fallback={LOADING}>
      <PageContainerNarrow>
        <Row noGutters>
          <Col>
            <PageHeading>{t(pathogenName)}</PageHeading>
          </Col>
        </Row>

        <Row noGutters>
          <Col>
            <pre>{JSON.stringify({ pathogenName })}</pre>
          </Col>
        </Row>
      </PageContainerNarrow>
    </Suspense>
  )
}
