import { sortBy } from 'lodash'
import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import styled from 'styled-components'
import { Button, Col, Form, FormGroup, Row } from 'reactstrap'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { Pathogen, useRegionsDataQuery } from 'src/io/getData'
import { fuzzySearch } from 'src/helpers/fuzzySearch'
import { pathogenAtom } from 'src/state/pathogen.state'
import {
  continentAtom,
  countryAtom,
  geographyDisableAllAtom,
  geographyEnableAllAtom,
  geographySearchTermAtom,
} from 'src/state/geography.state'
import { CheckboxWithIcon } from 'src/components/Common/Checkbox'

const GeoIconCountry = dynamic(() => import('src/components/Common/GeoIconCountry').then((m) => m.GeoIconCountry))
const GeoIconContinent = dynamic(() => import('src/components/Common/GeoIconContinent').then((m) => m.GeoIconContinent))

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

export function SidebarSectionGeography() {
  const pathogen = useRecoilValue(pathogenAtom)
  const { countries, regions } = useRegionsDataQuery(pathogen.name)
  const [searchTerm] = useRecoilState(geographySearchTermAtom)

  const checkboxes = useMemo(() => {
    const scored = [
      ...fuzzySearch(regions, searchTerm).map(({ item, score }) => ({
        component: <ContinentCheckbox key={item} continent={item} />,
        score,
      })),
      ...fuzzySearch(countries, searchTerm).map(({ item, score }) => ({
        component: <CountryCheckbox key={item} country={item} />,
        score,
      })),
    ]
    return sortBy(scored, ({ score }) => score).map(({ component }) => component)
  }, [countries, regions, searchTerm])

  return (
    <Container>
      <GeographySelectAll pathogen={pathogen} />
      <Form>{checkboxes}</Form>
    </Container>
  )
}

export interface GeographySelectAllProps {
  pathogen: Pathogen
}

export function GeographySelectAll({ pathogen }: GeographySelectAllProps) {
  const { t } = useTranslationSafe()
  const selectAll = useSetRecoilState(geographyEnableAllAtom(pathogen.name))
  const deselectAll = useSetRecoilState(geographyDisableAllAtom(pathogen.name))
  return (
    <Row noGutters>
      <Col className="d-flex">
        <FormGroup className="flex-grow-0 mx-auto">
          <Button type="button" color="link" onClick={selectAll}>
            {t('Select all')}
          </Button>
          <Button type="button" color="link" onClick={deselectAll}>
            {t('Deselect all')}
          </Button>
        </FormGroup>
      </Col>
    </Row>
  )
}

export function CountryCheckbox({ country }: { country: string }) {
  const { t } = useTranslationSafe()
  const pathogen = useRecoilValue(pathogenAtom)
  const [countryEnabled, setCountryEnabled] = useRecoilState(countryAtom({ pathogen: pathogen.name, country }))
  const Icon = useMemo(() => <GeoIconCountry country={country} />, [country])
  const text = useMemo(() => t(country), [country, t])
  return (
    <CheckboxWithIcon label={text} title={text} icon={Icon} checked={countryEnabled} setChecked={setCountryEnabled} />
  )
}

export function ContinentCheckbox({ continent }: { continent: string }) {
  const { t } = useTranslationSafe()
  const pathogen = useRecoilValue(pathogenAtom)
  const [continentEnabled, setContinentEnabled] = useRecoilState(continentAtom({ pathogen: pathogen.name, continent }))
  const Icon = useMemo(() => <GeoIconContinent continent={continent} />, [continent])
  const text = useMemo(() => t(continent), [continent, t])
  return (
    <CheckboxWithIcon
      title={text}
      label={text}
      icon={Icon}
      checked={continentEnabled}
      setChecked={setContinentEnabled}
    />
  )
}
