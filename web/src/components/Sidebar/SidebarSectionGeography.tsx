import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { pathogenAtom } from 'src/state/pathogen.state'
import styled from 'styled-components'
import { Button, Col, Form, FormGroup, Row } from 'reactstrap'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { CheckboxWithIcon } from 'src/components/Common/CheckboxWithIcon'
import { continentAtom, countryAtom, geographyDisableAllAtom, geographyEnableAllAtom } from 'src/state/geography.state'
import { Pathogen, useRegionsDataQuery } from 'src/io/getData'

const GeoIconCountry = dynamic(() => import('src/components/Common/GeoIconCountry').then((m) => m.GeoIconCountry))
const GeoIconContinent = dynamic(() => import('src/components/Common/GeoIconContinent').then((m) => m.GeoIconContinent))

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

export function SidebarSectionGeography() {
  const pathogen = useRecoilValue(pathogenAtom)

  const regionComponents = useMemo(() => {
    return (
      <Row noGutters>
        <Col>
          <ContinentCheckboxes />
        </Col>
      </Row>
    )
  }, [])

  const countryComponents = useMemo(
    () => (
      <Row noGutters>
        <Col>
          <CountryCheckboxes />
        </Col>
      </Row>
    ),
    [],
  )

  return (
    <Container>
      <GeographySelectAll pathogen={pathogen} />
      {regionComponents}
      {countryComponents}
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

export function CountryCheckboxes() {
  const pathogen = useRecoilValue(pathogenAtom)
  const { countries } = useRegionsDataQuery(pathogen.name)
  const countryCheckboxes = useMemo(
    () => countries.map((country) => <CountryCheckbox key={country} country={country} />),
    [countries],
  )
  return <Form>{countryCheckboxes}</Form>
}

export function CountryCheckbox({ country }: { country: string }) {
  const { t } = useTranslationSafe()
  const pathogen = useRecoilValue(pathogenAtom)
  const [countryEnabled, setCountryEnabled] = useRecoilState(countryAtom({ pathogen: pathogen.name, country }))
  const Icon = useMemo(() => <GeoIconCountry country={country} />, [country])
  return <CheckboxWithIcon label={t(country)} Icon={Icon} checked={countryEnabled} setChecked={setCountryEnabled} />
}

export function ContinentCheckboxes() {
  const pathogen = useRecoilValue(pathogenAtom)
  const { regions } = useRegionsDataQuery(pathogen.name)
  const continentCheckboxes = useMemo(() => {
    return regions.map((continent) => {
      return <ContinentCheckbox key={continent} continent={continent} />
    })
  }, [regions])
  return <Form>{continentCheckboxes}</Form>
}

export function ContinentCheckbox({ continent }: { continent: string }) {
  const { t } = useTranslationSafe()
  const pathogen = useRecoilValue(pathogenAtom)
  const [continentEnabled, setContinentEnabled] = useRecoilState(continentAtom({ pathogen: pathogen.name, continent }))
  const Icon = useMemo(() => <GeoIconContinent continent={continent} />, [continent])
  return (
    <CheckboxWithIcon label={t(continent)} Icon={Icon} checked={continentEnabled} setChecked={setContinentEnabled} />
  )
}
