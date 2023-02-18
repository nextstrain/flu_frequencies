import React, { ReactNode } from 'react'
import styled from 'styled-components'
import type { SetterOrUpdater } from 'src/types'
import { Checkbox } from 'src/components/Common/Checkbox'

export interface CheckboxWithIconProps {
  label?: string
  Icon?: ReactNode
  checked: boolean
  setChecked: SetterOrUpdater<boolean>
}

export function CheckboxWithIcon({ label, Icon = null, checked, setChecked }: CheckboxWithIconProps) {
  return (
    <Checkbox label={label} checked={checked} setChecked={setChecked}>
      <FlagAlignment>
        {Icon}
        <span>{label}</span>
      </FlagAlignment>
    </Checkbox>
  )
}

const FlagAlignment = styled.span`
  display: inline-flex;
  align-items: center;
  margin-left: 0.25em;

  > * + * {
    margin-left: 0.5em;
  }
`
