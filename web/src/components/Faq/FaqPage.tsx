import React, { Suspense } from 'react'
import { Col, Row } from 'reactstrap'
import { LOADING } from 'src/components/Loading/Loading'
import { MdxContent } from 'src/i18n/getMdxContent'
import { PageHeading } from 'src/components/Common/PageHeading'
import { PageContainerNarrow } from 'src/components/Layout/PageContainer'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'

export function FaqPage() {
  const { t } = useTranslationSafe()

  return (
    <Suspense fallback={LOADING}>
      <PageContainerNarrow>
        <Row noGutters>
          <Col>
            <PageHeading>{t('Frequently asked questions')}</PageHeading>
          </Col>
        </Row>

        <Row noGutters>
          <Col>
            <MdxContent filepath="Faq.md" />
          </Col>
        </Row>
      </PageContainerNarrow>
    </Suspense>
  )
}
