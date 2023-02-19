import React, { useMemo } from 'react'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { ColoredBox } from 'src/components/Common/ColoredBox'
import { pathogenAtom } from 'src/state/pathogen.state'
import styled from 'styled-components'
import { Button, Col, Form, FormGroup, Row } from 'reactstrap'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { CheckboxWithIcon } from 'src/components/Common/CheckboxWithIcon'
import { variantAtom, variantsDisableAllAtom, variantsEnableAllAtom } from 'src/state/variants.state'
import { Pathogen, useVariantsDataQuery, useVariantStyle } from 'src/io/getData'

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

export function SidebarSectionVariants() {
  const pathogen = useRecoilValue(pathogenAtom)

  const variantsComponents = useMemo(() => {
    return (
      <Row noGutters>
        <Col>
          <VariantsCheckboxes />
        </Col>
      </Row>
    )
  }, [])

  return (
    <Container>
      <VariantsSelectAll pathogen={pathogen} />
      {variantsComponents}
    </Container>
  )
}

export interface VariantsSelectAllProps {
  pathogen: Pathogen
}

export function VariantsSelectAll({ pathogen }: VariantsSelectAllProps) {
  const { t } = useTranslationSafe()
  const selectAll = useSetRecoilState(variantsEnableAllAtom(pathogen.name))
  const deselectAll = useSetRecoilState(variantsDisableAllAtom(pathogen.name))
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

export function VariantsCheckboxes() {
  const pathogen = useRecoilValue(pathogenAtom)
  const { variants } = useVariantsDataQuery(pathogen.name)
  const countryCheckboxes = useMemo(
    () => variants.map((variant) => <VariantsCheckbox key={variant} variant={variant} />),
    [variants],
  )
  return <Form>{countryCheckboxes}</Form>
}

export function VariantsCheckbox({ variant }: { variant: string }) {
  const { t } = useTranslationSafe()
  const pathogen = useRecoilValue(pathogenAtom)
  const { color } = useVariantStyle(pathogen.name, variant)
  const [variantEnabled, setVariantEnabled] = useRecoilState(variantAtom({ pathogen: pathogen.name, variant }))
  const Icon = useMemo(() => <ColoredBox $color={color} $size={16} />, [color])
  return <CheckboxWithIcon label={t(variant)} Icon={Icon} checked={variantEnabled} setChecked={setVariantEnabled} />
}
