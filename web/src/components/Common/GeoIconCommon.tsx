import React, { Fragment } from 'react'
import styled from 'styled-components'

export const GeoIconWrapper = styled.div`
  height: calc(1em + 2px);
  width: calc(1.5em + 2px);
  border: 1px solid #ced4da;
  display: flex;

  > * {
    width: 100%;
    height: 100%;
  }
`

export function EmptyIcon() {
  // eslint-disable-next-line react/jsx-no-useless-fragment,react/jsx-fragments
  return <Fragment />
}
