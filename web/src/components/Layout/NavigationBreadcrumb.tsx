import React, { PropsWithChildren, useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { NavItem as NavItemBase, NavLink as NavLinkBase } from 'reactstrap'
import Route from 'route-parser'
import { head, isNil } from 'lodash-es'
import { useRouter } from 'next/router'
import Select, { StylesConfig } from 'react-select'
import urljoin from 'url-join'
import { BsCaretRightFill as ArrowRight } from 'react-icons/bs'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { Link } from 'src/components/Link/Link'
import { DropdownOption } from 'src/components/Common/DropdownWithSearch'
import { usePathogen, useRegionsDataQuery, useVariantsDataQuery } from 'src/io/getData'

const paths = [
  '/pathogen/:pathogenName',
  '/pathogen/:pathogenName/variants/:variant',
  '/pathogen/:pathogenName/regions/:region',
]

export interface ParsePathResult {
  path: string
  params: PathParams
}

export interface PathParams {
  pathogenName?: string
  variant?: string
  region?: string
}

function matchRoute<T extends Record<string, string | undefined>>(asPath: string, route: string) {
  const routeMatcher = new Route<T>(route)
  return routeMatcher.match(asPath)
}

function useParsePath(asPath: string): ParsePathResult {
  return (head(
    paths
      .map((path) => ({
        path,
        params: matchRoute(asPath, path),
      }))
      .filter(({ params }) => !isNil(params) && !!params),
  ) ?? { params: {} }) as ParsePathResult
}

// HACK: TODO: Very naive and costly to maintain route-dependent breadcrumb for our SPA.
// Must be synchronized with the equally naive router in the `pages/_app.tsx`.
// Next.js 13 app directory should bring improvements to app layout and routing in SPAs, so that we don't have to
// keep all this, hopefully. But at the time of writing app dir did not support "next export" (SSG).
export function NavigationBreadcrumb() {
  const { t } = useTranslationSafe()
  const { asPath } = useRouter()
  const {
    path,
    params: { pathogenName, variant, region },
  } = useParsePath(asPath)

  const segments = useMemo(() => {
    const segments = [
      <BreadcrumbLink key="home" href="/">
        {t('Home')}
      </BreadcrumbLink>,
    ]
    if (path === '/pathogen/:pathogenName' && !isNil(pathogenName)) {
      segments.push(
        <BreadcrumbLink key={pathogenName} href={urljoin('pathogen', pathogenName)}>
          <PathogenName pathogenName={pathogenName} />
        </BreadcrumbLink>,
      )
    } else if (path === '/pathogen/:pathogenName/variants/:variant' && !isNil(pathogenName) && !isNil(variant)) {
      segments.push(
        <BreadcrumbLink key={pathogenName} href={urljoin('pathogen', pathogenName)}>
          <PathogenName pathogenName={pathogenName} />
        </BreadcrumbLink>,
        <BreadcrumbVariantSelector key={variant} pathogenName={pathogenName} variant={variant} />,
      )
    } else if (path === '/pathogen/:pathogenName/regions/:region' && !isNil(pathogenName) && !isNil(region)) {
      segments.push(
        <BreadcrumbLink key={pathogenName} href={urljoin('pathogen', pathogenName)}>
          <PathogenName pathogenName={pathogenName} />
        </BreadcrumbLink>,
        <BreadcrumbRegionSelector key={region} pathogenName={pathogenName} region={region} />,
      )
    }
    return segments
  }, [path, pathogenName, region, t, variant])

  const segmentsAndArrows = useMemo(() => {
    const segmentsAndArrows = []
    // eslint-disable-next-line no-loops/no-loops
    for (const [i, segment] of segments.entries()) {
      segmentsAndArrows.push(segment)
      if (i < segments.length - 1) {
        segmentsAndArrows.push(<BreadcrumbArrow key={`arrow-${i}`} />)
      }
    }
    return segmentsAndArrows
  }, [segments])

  return <span>{segmentsAndArrows}</span>
}

export interface BreadcrumbLinkProps extends PropsWithChildren {
  href: string
}

export function BreadcrumbLink({ href, children }: BreadcrumbLinkProps) {
  return (
    <NavItem>
      <NavLink tag={Link} href={href}>
        {children}
      </NavLink>
    </NavItem>
  )
}

export interface PathogenNameProps {
  pathogenName: string
}

export function PathogenName({ pathogenName }: PathogenNameProps) {
  const { t } = useTranslationSafe()
  const pathogen = usePathogen(pathogenName)

  return <>{t(pathogen.nameFriendly)}</>
}

export const NavItem = styled(NavItemBase)`
  display: inline-flex;
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

export function BreadcrumbArrow() {
  return <ArrowRight size={20} className="mx-2 pb-1" />
}

export interface BreadcrumbVariantSelectorProps {
  pathogenName: string
  variant: string
}

export function BreadcrumbVariantSelector({ pathogenName, variant }: BreadcrumbVariantSelectorProps) {
  const { push } = useRouter()
  const [value, setValue] = useState(variant)
  const { variants } = useVariantsDataQuery(pathogenName)
  const options = useMemo(() => variants.map((variant) => ({ label: variant, value: variant })), [variants])
  const option = useMemo(() => ({ label: value, value }), [value])
  const onChange = useCallback(
    (option: DropdownOption<string> | null) => {
      if (option) {
        void push(urljoin('pathogen', pathogenName, 'variants', option.value)) // eslint-disable-line no-void
        setValue(option.value)
      }
    },
    [pathogenName, push],
  )

  return (
    <span className="d-inline-flex">
      <Select
        options={options}
        value={option}
        onChange={onChange}
        isClearable={false}
        isMulti={false}
        isSearchable
        menuPortalTarget={document.body}
        styles={BREADCRUMB_DROPDOWN_STYLES}
      />
    </span>
  )
}

const BREADCRUMB_DROPDOWN_STYLES: StylesConfig<{ label: string; value: string }> = {
  container: (base) => ({ ...base, width: '200px' }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
}

export interface BreadcrumbRegionSelectorProps {
  pathogenName: string
  region: string
}

export function BreadcrumbRegionSelector({ pathogenName, region }: BreadcrumbRegionSelectorProps) {
  const { t } = useTranslationSafe()
  const { push } = useRouter()
  const [value, setValue] = useState(region)
  const { regions, countries } = useRegionsDataQuery(pathogenName)
  const locations = useMemo(() => [...regions, ...countries], [countries, regions])
  const options = useMemo(
    () =>
      locations.map((location) => ({
        label: t(location),
        value: location,
      })),
    [locations, t],
  )
  const option = useMemo(() => ({ label: t(value), value }), [t, value])
  const onChange = useCallback(
    (option: DropdownOption<string> | null) => {
      if (option) {
        void push(urljoin('pathogen', pathogenName, 'regions', option.value)) // eslint-disable-line no-void
        setValue(option.value)
      }
    },
    [pathogenName, push],
  )

  return (
    <span className="d-inline-flex">
      <Select
        options={options}
        value={option}
        onChange={onChange}
        isClearable={false}
        isMulti={false}
        isSearchable
        menuPortalTarget={document.body}
        styles={BREADCRUMB_DROPDOWN_STYLES}
      />
    </span>
  )
}
