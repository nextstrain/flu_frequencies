import React from 'react'
import styled from 'styled-components'
import { Nav as NavBase, Navbar as NavbarBase } from 'reactstrap'
import { Link } from 'src/components/Link/Link'
import BrandLogoBase from 'src/assets/images/logo.svg'
import { LanguageSwitcher } from 'src/components/Layout/LanguageSwitcher'
import { NavigationBreadcrumb } from 'src/components/Layout/NavigationBreadcrumb'

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

export const BrandLogoSmall = styled(BrandLogoBase)`
  height: 30px;
`

const BrandWrapper = styled.div`
  margin-right: 2rem;
  margin-left: 1rem;
`

export function NavigationBar() {
  return (
    <Navbar expand="xs" role="navigation">
      <BrandWrapper>
        <Link href="/">
          <BrandLogoSmall />
        </Link>
      </BrandWrapper>

      <NavWrappable navbar>
        <NavigationBreadcrumb />
      </NavWrappable>

      <Nav className="ml-auto" navbar>
        <LanguageSwitcher />
      </Nav>
    </Navbar>
  )
}
