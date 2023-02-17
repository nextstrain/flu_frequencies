import React, { Fragment, Suspense } from 'react'
import { Col, Row } from 'reactstrap'
import { Pathogen } from 'src/io/getData'
import urljoin from 'url-join'
import { useAxiosQuery } from 'src/hooks/useAxiosQuery'
import { MdxContent } from 'src/i18n/getMdxContent'
import { getDataRootUrl } from 'src/io/getDataRootUrl'
import { PageContainerNarrow } from 'src/components/Layout/PageContainer'
import { LOADING } from 'src/components/Loading/Loading'
import { Link } from 'src/components/Link/Link'

export interface IndexJson {
  pathogens: Pathogen[]
}

export function useIndexJsonQuery(): IndexJson {
  return useAxiosQuery(urljoin(getDataRootUrl(), 'index.json'))
}

export function HomePage() {
  const { pathogens } = useIndexJsonQuery()

  return (
    <Suspense fallback={LOADING}>
      <PageContainerNarrow>
        <Row noGutters>
          <Col>
            <MdxContent filepath="Home.md" />
          </Col>
        </Row>
        <Row noGutters>
          <Col>
            <ul>
              {pathogens.map((pathogen) => (
                <Fragment key={pathogen.name}>
                  <li>
                    <Link href={`/${pathogen.name}/variants`}>{`/${pathogen.name}/variants`}</Link>
                  </li>
                  <li>
                    <Link href={`/${pathogen.name}/regions`}>{`/${pathogen.name}/regions`}</Link>
                  </li>
                </Fragment>
              ))}
            </ul>
          </Col>
        </Row>
      </PageContainerNarrow>
    </Suspense>
  )
}
