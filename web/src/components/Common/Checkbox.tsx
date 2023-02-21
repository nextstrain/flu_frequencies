import React, { PropsWithChildren, ReactNode, useCallback } from 'react'
import { FormGroup as FormGroupBase, Input, Label as LabelBase } from 'reactstrap'
import styled from 'styled-components'
import type { SetterOrUpdater } from 'src/types'

export interface CheckboxProps extends PropsWithChildren {
  title?: string
  checked: boolean
  setChecked: SetterOrUpdater<boolean>
}

export function Checkbox({ title, checked, setChecked, children }: CheckboxProps) {
  const onChange = useCallback(() => {
    setChecked((checkedPrev) => !checkedPrev)
  }, [setChecked])

  return (
    <FormGroup check onClick={onChange}>
      <Input id={title} type="checkbox" checked={checked} />
      <Label htmlFor={title} check>
        {children}
      </Label>
    </FormGroup>
  )
}

export interface CheckboxWithTextProps extends Omit<CheckboxProps, 'children'> {
  label: string
}

export function CheckboxWithText({ label, title, checked, setChecked }: CheckboxWithTextProps) {
  const onChange = useCallback(() => {
    setChecked((checkedPrev) => !checkedPrev)
  }, [setChecked])

  return (
    <FormGroup check title={title} onClick={onChange}>
      <Input id={label} type="checkbox" checked={checked} />
      <Label htmlFor={label} check>
        <CheckboxText>{label}</CheckboxText>
      </Label>
    </FormGroup>
  )
}

export interface CheckboxWithIconProps extends Omit<CheckboxProps, 'children'> {
  label: string
  icon: ReactNode
}

export function CheckboxWithIcon({ title, label, icon, checked, setChecked }: CheckboxWithIconProps) {
  return (
    <Checkbox title={title} checked={checked} setChecked={setChecked}>
      {icon}
      <CheckboxText>{label}</CheckboxText>
    </Checkbox>
  )
}

const FormGroup = styled(FormGroupBase)`
  overflow-x: hidden;
`

const Label = styled(LabelBase)`
  white-space: nowrap;
  overflow-x: hidden;
  text-overflow: ellipsis;
  display: block;
`

const CheckboxText = styled.span`
  margin-left: 0.3rem;
`
