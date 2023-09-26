import { VariantsSortingBy, variantsSortingCriteriaAtom } from 'src/state/settings.state'
import { TFunction, useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { ErrorInternal } from 'src/helpers/ErrorInternal'
import { useRecoilState } from 'recoil'
import React, { useCallback, useMemo } from 'react'
import { Dropdown as DropdownBase, DropdownEntry } from 'src/components/Common/Dropdown'
import styled from 'styled-components'
import { FormGroup as FormGroupBase } from 'reactstrap'

function getSortingString(key: VariantsSortingBy, t: TFunction): string {
  switch (key) {
    case VariantsSortingBy.Name: {
      return t('Name')
    }
    case VariantsSortingBy.Frequency: {
      return t('Frequency')
    }
    default: {
      throw new ErrorInternal('getSortingString: unexpected value for enum')
    }
  }
}

export function SortingCriteriaSelector() {
  const { t } = useTranslationSafe()
  const [sorting, setSorting] = useRecoilState(variantsSortingCriteriaAtom)

  const setCurrentEntry = useCallback(
    (entry: DropdownEntry<VariantsSortingBy>) => {
      setSorting(entry.key)
    },
    [setSorting],
  )

  const { entries } = useMemo(() => {
    const entries = Object.values(VariantsSortingBy).map((key) => {
      const value = getSortingString(key, t)
      return {
        key,
        value: (
          <span key={key} title={value}>
            {value}
          </span>
        ),
      }
    })
    return { entries }
  }, [t])

  const currentEntry = useMemo(() => {
    const e = entries.find((entry) => entry.key === sorting)
    if (!e) {
      throw new ErrorInternal(`Not found: '${e}'`)
    }

    return { key: e.key, value: e.value }
  }, [entries, sorting])

  const label = t('Sort by')

  return (
    <FormGroup>
      <LabelText title={label}>{label}</LabelText>
      <Dropdown entries={entries} currentEntry={currentEntry} setCurrentEntry={setCurrentEntry} />
    </FormGroup>
  )
}

const FormGroup = styled(FormGroupBase)`
  display: flex !important;
  margin: 0;
  margin-top: 0.5rem;
`

const Dropdown = styled(DropdownBase)`
  flex: 0 0 150px;
  vertical-align: middle;
  margin: 0;
`

const LabelText = styled.span`
  flex: 1;

  vertical-align: middle;
  margin: auto 0;
  margin-right: 5px;

  white-space: nowrap;
  overflow-x: hidden;
  text-overflow: ellipsis;
`
