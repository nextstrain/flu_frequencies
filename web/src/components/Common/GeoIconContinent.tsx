import { get } from 'lodash-es'
import React, { ComponentType, SVGProps, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { EmptyIcon, GeoIconWrapper } from 'src/components/Common/GeoIconCommon'

type S = SVGProps<SVGSVGElement>

const Africa = dynamic<S>(() => import('src/assets/images/continents/Africa.svg'), { ssr: false })
const Asia = dynamic<S>(() => import('src/assets/images/continents/Asia.svg'), { ssr: false })
const Europe = dynamic<S>(() => import('src/assets/images/continents/Europe.svg'), { ssr: false })
const NorthAmerica = dynamic<S>(() => import('src/assets/images/continents/North America.svg'), { ssr: false })
const Oceania = dynamic<S>(() => import('src/assets/images/continents/Oceania.svg'), { ssr: false })
const SouthAmerica = dynamic<S>(() => import('src/assets/images/continents/South America.svg'), { ssr: false })

export interface GeoIconContinentProps {
  continent: string
  size?: number
  color?: string
}

export function GeoIconContinent({ continent, size = 18, color = '#444444' }: GeoIconContinentProps) {
  const Icon = useMemo(() => {
    const icon = get(CONTINENT_ICONS, continent)
    if (icon) {
      return icon
    }
    console.info(`Unable to find icon for region '${continent}'`)
    return EmptyIcon
  }, [continent])
  return (
    <GeoIconWrapper $size={size}>
      <Icon fill={color} />
    </GeoIconWrapper>
  )
}

const CONTINENT_ICONS: Record<string, ComponentType<S>> = {
  'Africa': Africa,
  'Northern Africa': Africa,
  'Sub-Saharan Africa': Africa,
  'Eastern Africa': Africa,
  'Middle Africa': Africa,
  'Southern Africa': Africa,
  'Western Africa': Africa,

  'Central Asia': Asia,
  'Eastern Asia': Asia,
  'South-eastern Asia': Asia,
  'Southern Asia': Asia,
  'Western Asia': Asia,
  'China': Asia,

  'Asia': Asia,
  'Europe': Europe,
  'Eastern Europe': Europe,
  'Northern Europe': Europe,
  'Channel Islands': Europe,
  'Southern Europe': Europe,
  'Western Europe': Europe,

  'North America': NorthAmerica,
  'Central America': NorthAmerica,
  'Northern America': NorthAmerica,

  'Oceania': Oceania,
  'Australia and New Zealand': Oceania,
  'Melanesia': Oceania,
  'Micronesia': Oceania,
  'Polynesia': Oceania,

  'South America': SouthAmerica,
  'Latin America and the Caribbean': SouthAmerica,
  'Caribbean': SouthAmerica,
}
