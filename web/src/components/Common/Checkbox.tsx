import React, { PropsWithChildren, useCallback } from 'react'
import { FormGroup, Input, Label } from 'reactstrap'
import { SetterOrUpdater } from 'src/types'

export interface CheckboxProps extends PropsWithChildren {
  label?: string
  title?: string
  checked: boolean
  setChecked: SetterOrUpdater<boolean>
}

export function Checkbox({ title, checked, setChecked, children }: CheckboxProps) {
  const onChange = useCallback(() => {
    setChecked((checkedPrev) => !checkedPrev)
  }, [setChecked])

  return (
    <FormGroup check title={title}>
      <Label check>
        <Input type="checkbox" checked={checked} onChange={onChange} />
        {children}
      </Label>
    </FormGroup>
  )
}
