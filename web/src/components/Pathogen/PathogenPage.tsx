import React, { Suspense } from 'react'
import { Col, Row } from 'reactstrap'
import { PageHeading } from 'src/components/Common/PageHeading'
import { PageContainerNarrow } from 'src/components/Layout/PageContainer'
import { LOADING } from 'src/components/Loading/Loading'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { usePathogen } from 'src/io/getData'

export interface PathogenPageProps {
  pathogenName: string
}

export function PathogenPage({ pathogenName }: PathogenPageProps) {
  const { t } = useTranslationSafe()
  const pathogen = usePathogen(pathogenName)

  return (
    <Suspense fallback={LOADING}>
      <PageContainerNarrow>
        <Row noGutters>
          <Col>
            <PageHeading>{t(pathogen.nameFriendly)}</PageHeading>
          </Col>
        </Row>
      </PageContainerNarrow>
    </Suspense>
  )
}
