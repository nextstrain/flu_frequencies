import React, { PropsWithChildren } from 'react'
import styled from 'styled-components'
import { HEIGHT_NAVBAR, NavigationBar } from 'src/components/Layout/NavigationBar'

const Header = styled.div`
  height: ${HEIGHT_NAVBAR}px;
`

const Body = styled.div`
  position: absolute;
  top: calc(${HEIGHT_NAVBAR}px + 1rem);
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  background-color: ${(props) => props.theme.bodyBg};
`

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`

const Content = styled.div`
  flex: 1;
  display: flex;
  overflow: auto;
`

const Box = styled.div`
  min-height: min-content;
  display: flex;
  flex-direction: column;
  flex: 1;
`

export interface LayoutProps {
  wide?: boolean
}

export function Layout({ children }: PropsWithChildren<LayoutProps>) {
  return (
    <div>
      <Header>
        <NavigationBar />
      </Header>

      <Body>
        <Main>
          <Content>
            <Box>{children}</Box>
          </Content>
        </Main>
      </Body>
    </div>
  )
}
