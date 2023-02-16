import { useRouter } from 'next/router'
import React, { useMemo } from 'react'
import styled from 'styled-components'
import { Nav as NavBase, Navbar as NavbarBase, NavItem as NavItemBase, NavLink as NavLinkBase } from 'reactstrap'
import { Link } from 'src/components/Link/Link'
import BrandLogoBase from 'src/assets/images/logo.svg'
import { LanguageSwitcher } from 'src/components/Layout/LanguageSwitcher'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'

export const HEIGHT_NAVBAR = 50

export function matchingUrl(url: string, pathname: string): boolean {
  return url === pathname
}

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

export const NavItem = styled(NavItemBase)`
  padding: 0;
  @media (max-width: 991.98px) {
    margin: 0 auto;
  }
`

export const NavLink = styled(NavLinkBase)<{ active?: boolean }>`
  margin: 0 auto;
  padding: 5px;
  font-weight: bold;
  color: ${(props) => props.theme.bodyColor};
  text-decoration: none !important;
  ${({ active, theme }) =>
    active &&
    `
    color: ${theme.primary} !important;
    text-decoration: #fffa solid underline 3px;
  `}
`

export const BrandLogoSmall = styled(BrandLogoBase)`
  height: 30px;
`

const BrandWrapper = styled.div`
  margin-right: 2rem;
  margin-left: 1rem;
`

export function NavigationBar() {
  const { t } = useTranslationSafe()
  const { asPath } = useRouter()

  const navLinksLeft = useMemo(
    () => ({
      '/': t('Home'),
      '/faq': t('FAQ'),
    }),
    [t],
  )

  return (
    <Navbar expand="xs" role="navigation">
      <BrandWrapper>
        <Link href="/">
          <BrandLogoSmall />
        </Link>
      </BrandWrapper>

      <NavWrappable navbar>
        {Object.entries(navLinksLeft).map(([url, text]) => {
          return (
            <NavItem key={url}>
              <NavLink tag={Link} href={url} active={matchingUrl(url, asPath)}>
                {text}
              </NavLink>
            </NavItem>
          )
        })}
      </NavWrappable>

      <Nav className="ml-auto" navbar>
        <LanguageSwitcher />
      </Nav>
    </Navbar>
  )
}
