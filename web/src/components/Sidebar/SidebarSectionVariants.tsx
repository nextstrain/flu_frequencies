import React, { useMemo } from 'react'
import { Form } from 'reactstrap'
import { useRecoilState } from 'recoil'
import styled from 'styled-components'
import { ColoredBox } from 'src/components/Common/ColoredBox'
import { fuzzySearch } from 'src/helpers/fuzzySearch'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { Pathogen, usePathogen, useVariantsDataQuery, useVariantStyle } from 'src/io/getData'
import { variantsSearchTermAtom } from 'src/state/geography.state'
import { variantAtom, variantsEnableAllAtom } from 'src/state/variants.state'
import { CheckboxIndeterminateWithText, CheckboxWithIcon } from 'src/components/Common/Checkbox'
import { isEmpty } from 'lodash-es'

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

export interface SidebarSectionVariantsProps {
  pathogenName: string
}

export function SidebarSectionVariants({ pathogenName }: SidebarSectionVariantsProps) {
  const pathogen = usePathogen(pathogenName)
  const { variants } = useVariantsDataQuery(pathogenName)
  const [searchTerm] = useRecoilState(variantsSearchTermAtom)
  const checkboxes = useMemo(() => {
    const checkboxes = fuzzySearch(variants, searchTerm).map(({ item }) => (
      <VariantsCheckbox pathogenName={pathogenName} key={item} variant={item} />
    ))
    if (isEmpty(searchTerm)) {
      checkboxes.unshift(<VariantsSelectAll key="VariantsSelectAll" pathogen={pathogen} />)
    }
    return checkboxes
  }, [pathogen, pathogenName, searchTerm, variants])
  return (
    <Container>
      <Form>{checkboxes}</Form>
    </Container>
  )
}

export interface VariantsSelectAllProps {
  pathogen: Pathogen
}

export function VariantsSelectAll({ pathogen }: VariantsSelectAllProps) {
  const { t } = useTranslationSafe()
  const [isAllEnabled, setIsAllEnabled] = useRecoilState(variantsEnableAllAtom(pathogen.name))
  return (
    <CheckboxIndeterminateWithText
      label={t('Select all')}
      title={t('Select all')}
      state={isAllEnabled}
      onChange={setIsAllEnabled}
    />
  )
}

export interface VariantsCheckboxProps {
  pathogenName: string
  variant: string
}

export function VariantsCheckbox({ pathogenName, variant }: VariantsCheckboxProps) {
  const pathogen = usePathogen(pathogenName)
  const { color } = useVariantStyle(pathogen.name, variant)
  const [variantEnabled, setVariantEnabled] = useRecoilState(variantAtom({ pathogen: pathogen.name, variant }))
  const Icon = useMemo(() => <ColoredBox $color={color} $size={16} />, [color])
  return (
    <CheckboxWithIcon
      label={variant}
      title={variant}
      icon={Icon}
      checked={variantEnabled}
      setChecked={setVariantEnabled}
    />
  )
}
