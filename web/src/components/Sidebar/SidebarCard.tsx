import React, { PropsWithChildren, ReactNode } from 'react'
import { RecoilState } from 'recoil'
import styled from 'styled-components'
import { Card as CardBase, CardBody as CardBodyBase, CardHeader as CardHeaderBase } from 'reactstrap'
import { useRecoilToggle } from 'src/hooks/useToggle'

export function Sidebar({ children }: PropsWithChildren) {
  return (
    <SidebarOuterWrapper>
      <SidebarInnerWrapper>{children}</SidebarInnerWrapper>
    </SidebarOuterWrapper>
  )
}

const SIDEBAR_WIDTH = 300

export const SidebarOuterWrapper = styled.aside`
  display: flex;
  flex-direction: row;
  flex: 0;
  width: ${SIDEBAR_WIDTH}px;
  box-shadow: ${(props) => props.theme.shadows.blurredLight};
`

export const SidebarInnerWrapper = styled.div`
  padding-top: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  width: ${SIDEBAR_WIDTH}px;
`

export interface SidebarSectionProps extends PropsWithChildren {
  header?: ReactNode
}

export function SidebarSection({ header = null, children }: SidebarSectionProps) {
  return (
    <Card>
      <CardHeader>{header}</CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  )
}

export interface SidebarSectionCollapsibleProps extends PropsWithChildren {
  header?: ReactNode
  recoilState: RecoilState<boolean>
}

export function SidebarSectionCollapsible({ recoilState, header = null, children }: SidebarSectionCollapsibleProps) {
  const { state: isCollapsed, toggle: toggleCollapsed } = useRecoilToggle(recoilState)

  return (
    <CardCollapsible $isCollapsed={isCollapsed}>
      <CardCollapsibleHeader onClick={toggleCollapsed}>{header}</CardCollapsibleHeader>
      <CardCollapsibleBody $isCollapsed={isCollapsed}>{children}</CardCollapsibleBody>
    </CardCollapsible>
  )
}

const CARD_HEADER_HEIGHT_PX = 48

const Card = styled(CardBase)`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden auto;
  border-radius: 0 !important;
  box-shadow: none;
`

const CardHeader = styled(CardHeaderBase)`
  display: flex;
  background-color: #636e7b;
  color: #fff;
  border-radius: 0 !important;
  min-height: ${CARD_HEADER_HEIGHT_PX}px;
`

const CardBody = styled(CardBodyBase)`
  display: flex;
  flex-direction: column;
  flex: 1 1;
  overflow: hidden auto;
  border-radius: 0 !important;
  padding: 0.5rem 1rem;
`

const CardCollapsible = styled(Card)<{ $isCollapsed: boolean }>`
  flex: ${(props) => (props.$isCollapsed ? `0 1 ${CARD_HEADER_HEIGHT_PX}px` : '0 0 33%')};
  overflow: hidden;
  transition: all ease-out 0.3s;
`

const CardCollapsibleHeader = styled(CardHeader)`
  cursor: pointer;
`

const CardCollapsibleBody = styled(CardBody)<{ $isCollapsed: boolean }>`
  height: ${(props) => props.$isCollapsed && 0};
  overflow-y: ${(props) => (props.$isCollapsed ? 'hidden' : 'auto')};
  overflow-x: hidden;
`
