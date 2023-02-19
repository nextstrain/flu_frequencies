import { get } from 'lodash'
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
  const Icon = useMemo(() => get(CONTINENT_ICONS, continent, EmptyIcon), [continent])
  return (
    <GeoIconWrapper $size={size}>
      <Icon fill={color} />
    </GeoIconWrapper>
  )
}

const CONTINENT_ICONS: Record<string, ComponentType<S>> = {
  'Africa': Africa,
  'Asia': Asia,
  'Europe': Europe,
  'North America': NorthAmerica,
  'Oceania': Oceania,
  'South America': SouthAmerica,
}
