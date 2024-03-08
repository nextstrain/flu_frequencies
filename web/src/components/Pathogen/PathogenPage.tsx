import React, { useMemo, useState } from 'react'
import { Card as CardBase, CardBody as CardBodyBase, CardHeader as CardHeaderBase, Col, Row } from 'reactstrap'
import styled from 'styled-components'
import urljoin from 'url-join'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { useCountries, useRegions, useVariantsDataQuery, useVariantStyle } from 'src/io/getData'
import { LinkSmart } from 'src/components/Link/LinkSmart'
import { ColoredBox } from 'src/components/Common/ColoredBox'
import { GeoIconContinent } from 'src/components/Common/GeoIconContinent'
import { GeoIconCountry } from 'src/components/Common/GeoIconCountry'
import { Link } from 'src/components/Link/Link'
import { SearchBox } from 'src/components/Common/SearchBox'
import { fuzzySearch, fuzzySearchObj } from 'src/helpers/fuzzySearch'
import { sortBy } from 'lodash-es'
import { PageContainerNarrow } from 'src/components/Layout/PageContainer'
import { mix } from 'polished'

const PageContainer = styled(PageContainerNarrow)`
  height: 100%;
`

const ScreenHeightRow = styled(Row)`
  display: flex;
  flex: 0;
  flex-direction: row;
  height: 100%;
  width: 100%;

  @media (max-width: 767.98px) {
    margin: 0;
  }
`

const ScreenHeightCol = styled(Col)`
  display: flex;
  width: 100%;
  max-height: 100%;
  overflow: hidden;
  padding: 0;

  @media (max-width: 767.98px) {
    margin: 0;
  }
`

export interface PathogenPageProps {
  pathogenName: string
}

export function PathogenPage({ pathogenName }: PathogenPageProps) {
  return (
    <PageContainer>
      <ScreenHeightRow noGutters>
        <ScreenHeightCol md={6}>
          <ListOfVariants pathogenName={pathogenName} />
        </ScreenHeightCol>
        <ScreenHeightCol md={6}>
          <ListOfRegions pathogenName={pathogenName} />
        </ScreenHeightCol>
      </ScreenHeightRow>
    </PageContainer>
  )
}

const Card = styled(CardBase)<{ $disabled?: boolean }>`
  flex: 1;
  width: 100%;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  box-shadow: ${(props) => props.theme.shadows.blurredMedium};

  margin: 0.75rem 1rem;

  @media (max-width: 767.98px) {
    margin: 0.1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
  }
`

const CardHeader = styled(CardHeaderBase)`
  display: flex;
  background-color: ${(props) => props.theme.bodyBg};
  padding: 0.7rem;
  padding-top: 1rem;
`

const CardBody = styled(CardBodyBase)`
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0.7rem;
`

const Ul = styled.ul`
  flex: 1;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  border: ${(props) => props.theme.gray400} solid 1px;
  border-radius: 3px;
`

const Li = styled.li`
  display: flex;
  list-style: none;
  height: 2.5rem;

  background-color: ${(props) => props.theme.gray100};

  :nth-child(odd) {
    background-color: ${(props) => props.theme.gray300};
  }

  & a {
    flex: 1;
    color: ${(props) => props.theme.bodyColor};
    margin: auto 0;
    max-height: 100%;

    :hover {
      color: ${(props) => props.theme.bodyColor};
      background-color: ${(props) => mix(0.8)(props.theme.gray100, props.theme.primary)};

      :nth-child(odd) {
        background-color: ${(props) => mix(0.8)(props.theme.gray300, props.theme.primary)};
      }
    }
  }
`

const IconWrapper = styled.span`
  margin: 0.5rem;
`

const TextWrapper = styled.span`
  margin: 0.5rem;
`

export interface ListOfRegionsProps {
  pathogenName: string
}

export function ListOfRegions({ pathogenName, ...restProps }: ListOfRegionsProps) {
  const { t } = useTranslationSafe()
  const [searchTerm, setSearchTerm] = useState('')
  const regionsTranslated = useRegions(pathogenName)
  const countriesTranslated = useCountries(pathogenName)

  const items = useMemo(() => {
    const scored = [
      ...fuzzySearchObj(regionsTranslated, ['name', 'translated', 'transliterated'], searchTerm).map(
        ({ item: { name }, score }) => ({
          component: <ContinentItem key={name} pathogenName={pathogenName} continent={name} />,
          score,
        }),
      ),
      ...fuzzySearchObj(countriesTranslated, ['name', 'translated', 'transliterated'], searchTerm).map(
        ({ item: { name, code }, score }) => ({
          component: <CountryItem key={code} pathogenName={pathogenName} countryCode={code} countryName={name} />,
          score,
        }),
      ),
    ]
    return sortBy(scored, ({ score }) => score).map(({ component }) => component)
  }, [countriesTranslated, pathogenName, regionsTranslated, searchTerm])

  return (
    <Card {...restProps}>
      <CardHeader>
        <Row noGutters className="d-flex w-100">
          <Col>
            <h3 className="mx-2">{t('Regions')}</h3>
            <LinkSmart className="mx-2" href={`/pathogen/${pathogenName}/regions`}>
              {t('Compare')}
            </LinkSmart>
          </Col>
          <Col md={6} className="ml-auto">
            <SearchBox searchTitle={'Search regions'} searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
          </Col>
        </Row>
      </CardHeader>
      <CardBody>
        <Ul className="mt-1">{items}</Ul>
      </CardBody>
    </Card>
  )
}

export interface ListOfVariantsProps {
  pathogenName: string
}

export function ListOfVariants({ pathogenName, ...restProps }: ListOfVariantsProps) {
  const { t } = useTranslationSafe()
  const { variants } = useVariantsDataQuery(pathogenName)
  const [searchTerm, setSearchTerm] = useState('')
  const items = useMemo(
    () =>
      fuzzySearch(variants, searchTerm).map(({ item }) => (
        <VariantItem key={item} pathogenName={pathogenName} variant={item} />
      )),
    [pathogenName, searchTerm, variants],
  )

  return (
    <Card {...restProps}>
      <CardHeader>
        <Row noGutters className="d-flex w-100">
          <Col>
            <h3 className="mx-2">{t('Variants')}</h3>
            <LinkSmart className="mx-2" href={`/pathogen/${pathogenName}/variants`}>
              {t('Compare')}
            </LinkSmart>
          </Col>
          <Col md={6} className="ml-auto">
            <SearchBox searchTitle={'Search variants'} searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
          </Col>
        </Row>
      </CardHeader>
      <CardBody>
        <Ul className="mt-1">{items}</Ul>
      </CardBody>
    </Card>
  )
}

interface CountryItemProps {
  pathogenName: string
  countryCode: string
  countryName: string
}

function CountryItem({ pathogenName, countryName, countryCode }: CountryItemProps) {
  const { t } = useTranslationSafe()
  const Icon = useMemo(() => <GeoIconCountry country={countryName} size={25} />, [countryName])
  const text = useMemo(() => t(countryName), [countryName, t])
  const href = useMemo(() => urljoin('/pathogen', pathogenName, 'regions', countryCode), [countryCode, pathogenName])
  return (
    <Li>
      <Link href={href} title={text} className="text-decoration-none d-flex align-middle">
        <IconWrapper>{Icon}</IconWrapper>
        <TextWrapper>{text}</TextWrapper>
      </Link>
    </Li>
  )
}

export interface ContinentItemProps {
  pathogenName: string
  continent: string
}

export function ContinentItem({ pathogenName, continent }: ContinentItemProps) {
  const { t } = useTranslationSafe()
  const Icon = useMemo(() => <GeoIconContinent continent={continent} size={25} />, [continent])
  const text = useMemo(() => t(continent), [continent, t])
  const href = useMemo(() => urljoin('/pathogen', pathogenName, 'regions', continent), [continent, pathogenName])
  return (
    <Li>
      <Link href={href} title={text} className="text-decoration-none d-flex align-middle">
        <IconWrapper>{Icon}</IconWrapper>
        <TextWrapper>{text}</TextWrapper>
      </Link>
    </Li>
  )
}

export interface VariantsItemProps {
  pathogenName: string
  variant: string
}

export function VariantItem({ pathogenName, variant }: VariantsItemProps) {
  const { color } = useVariantStyle(pathogenName, variant)
  const Icon = useMemo(() => <ColoredBox $color={color} $size={16} />, [color])
  const href = useMemo(() => urljoin('/pathogen', pathogenName, 'variants', variant), [variant, pathogenName])
  return (
    <Li>
      <Link href={href} title={variant} className="text-decoration-none d-flex align-middle">
        <IconWrapper>{Icon}</IconWrapper>
        <TextWrapper>{variant}</TextWrapper>
      </Link>
    </Li>
  )
}
