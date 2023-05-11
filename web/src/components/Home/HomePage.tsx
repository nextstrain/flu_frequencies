import React from 'react'
import { Col, Row } from 'reactstrap'
import urljoin from 'url-join'
import styled from 'styled-components'
import { Pathogen } from 'src/io/getData'
import { useAxiosQuery } from 'src/hooks/useAxiosQuery'
import { MdxContent } from 'src/i18n/getMdxContent'
import { getDataRootUrl } from 'src/io/getDataRootUrl'
import { PageContainerNarrow } from 'src/components/Layout/PageContainer'
import { PathogenCard } from 'src/components/Home/PathogenCard'

export interface IndexJson {
  pathogens: Pathogen[]
}

export function useIndexJsonQuery(): IndexJson {
  return useAxiosQuery(urljoin(getDataRootUrl(), 'index.json'))
}

export function HomePage() {
  const { pathogens } = useIndexJsonQuery()

  return (
    <PageContainerNarrow>
      <Row tag={Ul} noGutters className="mt-3">
        {pathogens.map((pathogen) => (
          <Col tag={Li} xs={12} sm={6} md={4} xl={3} key={pathogen.name}>
            <PathogenCard pathogen={pathogen} />
          </Col>
        ))}
      </Row>
      <Row noGutters>
        <Col>
          <MdxContent filepath="Home.md" />
        </Col>
      </Row>
    </PageContainerNarrow>
  )
}

const Ul = styled.ul`
  padding: 0;
`

const Li = styled.li`
  list-style: none;
`
