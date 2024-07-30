import React, { useMemo } from 'react'
import styled from 'styled-components'
import { VariantsPlot } from 'src/components/Variants/VariantsPlot'
import { VariantsSidebar } from 'src/components/Variants/VariantsSidebar'
import { PageContainerHorizontal } from 'src/components/Layout/PageContainer'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { usePathogen, useVariantDataQuery, useVariantsDataQuery } from 'src/io/getData'
import { Col, Row } from 'reactstrap'
import urljoin from 'url-join'
import { LinkButtonNext, LinkButtonPrev } from 'src/components/Common/LinkButtonNextPrev'

export interface VariantsPageProps {
  pathogenName: string
  variantName: string
}

export default function VariantPage({ pathogenName, variantName }: VariantsPageProps) {
  const { t } = useTranslationSafe()
  const pathogen = usePathogen(pathogenName)
  const {
    variantData: { variant },
  } = useVariantDataQuery(pathogenName, variantName)
  const { variants } = useVariantsDataQuery(pathogenName)

  const { prev, next } = useMemo(() => {
    const i = variants.indexOf(variant)
    const prevName = variants[i - 1] ?? variants[variants.length - 1]
    const prev = <LinkButtonPrev text={t(prevName)} href={urljoin('pathogen', pathogenName, 'variants', prevName)} />
    const nextName = variants[i + 1] ?? variants[0]
    const next = <LinkButtonNext text={t(nextName)} href={urljoin('pathogen', pathogenName, 'variants', nextName)} />
    return { prev, next }
  }, [variants, variant, t, pathogenName])

  return (
    <PageContainerHorizontal>
      <VariantsSidebar pathogenName={pathogenName} />

      <MainContent>
        <MainContentInner>
          <Row noGutters>
            <Col>
              <span className="d-flex w-100 mt-2">
                <span className="ml-2 mr-auto">{prev}</span>
                <h4 className="text-center">
                  {t('{{name}}, variant {{variant}}', {
                    name: t(pathogen.nameFriendly),
                    variant: variantName,
                  })}
                </h4>
                <span className="mr-2 ml-auto">{next}</span>
              </span>
            </Col>
          </Row>

          <VariantsPlot pathogen={pathogen} variantName={variant} />
        </MainContentInner>
      </MainContent>
    </PageContainerHorizontal>
  )
}

const MainContent = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1 1 100%;
  overflow: hidden;
`

const MainContentInner = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 100%;
  overflow: hidden;
`
