import React from 'react'
import styled from 'styled-components'
import { Nav as NavBase, Navbar as NavbarBase } from 'reactstrap'
import { Link } from 'src/components/Link/Link'
import BrandLogoBase from 'src/assets/images/logo.svg'
import { LanguageSwitcher } from 'src/components/Layout/LanguageSwitcher'
import { NavigationBreadcrumb } from 'src/components/Layout/NavigationBreadcrumb'
import { PROJECT_NAME } from 'src/constants'

export const HEIGHT_NAVBAR = 50

export const Navbar = styled(NavbarBase)`
  height: ${HEIGHT_NAVBAR}px;
  width: 100%;
  box-shadow: ${(props) => props.theme.shadows.medium};
  z-index: 100;
  background-color: ${(props) => props.theme.white};
  opacity: 1;
`

export const Nav = styled(NavBase)`
  background-color: transparent !important;
`

export const NavWrappable = styled(NavBase)`
  overflow-y: scroll;

  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  width: 100%;

  & .nav-link {
    padding: 5px;
  }
`

export function NavigationBar() {
  return (
    <Navbar expand="xs" role="navigation">
      <Brand />

      <NavWrappable navbar>
        <NavigationBreadcrumb />
      </NavWrappable>

      <Nav className="ml-auto" navbar>
        <LanguageSwitcher />
      </Nav>
    </Navbar>
  )
}

const BrandWrapper = styled.div`
  display: flex;
  height: 100%;
  margin-bottom: 0.1rem;
`
export const BrandLogoSmall = styled(BrandLogoBase)`
  flex: 1;
  height: 36px;
  margin-left: 1rem;
`

const BrandNameStyled = styled.span`
  flex: 1;
  color: #521717;
  font-size: 24px;
  font-weight: bold;
  margin-left: 1rem;
  margin-right: 2rem;
`

export function Brand() {
  return (
    <Link href="/" className="text-decoration-none">
      <BrandWrapper>
        <BrandLogoSmall />
        <BrandNameStyled>{PROJECT_NAME}</BrandNameStyled>
      </BrandWrapper>
    </Link>
  )
}
