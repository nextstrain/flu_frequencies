import React, { Fragment } from 'react'
import styled from 'styled-components'

export const GeoIconWrapper = styled.div<{ $size: number }>`
  width: ${(props) => props.$size * 1.5}px;
  height: ${(props) => props.$size}px;
  border: 1px solid #ced4da;
  display: inline-flex;
`

export function EmptyIcon() {
  // eslint-disable-next-line react/jsx-no-useless-fragment,react/jsx-fragments
  return <Fragment />
}
