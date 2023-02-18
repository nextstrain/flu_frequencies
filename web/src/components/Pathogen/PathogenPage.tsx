import React, { Suspense } from 'react'
import { Col, Row } from 'reactstrap'
import { useRecoilValue } from 'recoil'
import { PageHeading } from 'src/components/Common/PageHeading'
import { PageContainerNarrow } from 'src/components/Layout/PageContainer'
import { LOADING } from 'src/components/Loading/Loading'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { pathogenAtom } from 'src/state/pathogen.state'

export function PathogenPage() {
  const { t } = useTranslationSafe()
  const pathogen = useRecoilValue(pathogenAtom)

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
