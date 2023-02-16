import { MDXProvider } from '@mdx-js/react'
import React, { Suspense } from 'react'
import { Col, Row } from 'reactstrap'
import { getMdxComponents } from 'src/components/Common/MdxComponents'
import { PageContainerNarrow } from 'src/components/Layout/PageContainer'
import { LOADING } from 'src/components/Loading/Loading'
import { MdxContent } from 'src/i18n/getMdxContent'

export function HomePage() {
  return (
    <Suspense fallback={LOADING}>
      <PageContainerNarrow>
        <Row noGutters>
          <Col>
            <MDXProvider components={getMdxComponents}>
              <MdxContent filepath="Home.md" />
            </MDXProvider>
          </Col>
        </Row>
      </PageContainerNarrow>
    </Suspense>
  )
}
