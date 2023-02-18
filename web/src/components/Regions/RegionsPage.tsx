import React, { Suspense } from 'react'
import { Col, Container, Row } from 'reactstrap'
import { useRecoilValue } from 'recoil'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { useRegionsDataQuery } from 'src/io/getData'
import { RegionsPlot } from 'src/components/Regions/RegionsPlot'
import { PageHeading } from 'src/components/Common/PageHeading'
import { PageContainer } from 'src/components/Layout/PageContainer'
import { LOADING } from 'src/components/Loading/Loading'
import { pathogenAtom } from 'src/state/pathogen.state'

export function RegionsPage() {
  const { t } = useTranslationSafe()
  const pathogen = useRecoilValue(pathogenAtom)
  const { regions, countries } = useRegionsDataQuery(pathogen.name)

  return (
    <Suspense fallback={LOADING}>
      <PageContainer>
        <Row noGutters>
          <Col>
            <PageHeading>{t('{{name}}: regions', { name: t(pathogen.nameFriendly) })}</PageHeading>
          </Col>
        </Row>

        <Row noGutters>
          <Col>
            <Container fluid>
              {[...regions, ...countries].map((region) => (
                <Row key={region} noGutters className="mb-5">
                  <Col>
                    <h3 className="text-center">{region}</h3>
                    <RegionsPlot pathogen={pathogen} countryName={region} />
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
