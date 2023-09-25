/* eslint-disable only-ascii/only-ascii */
import { get } from 'lodash-es'
import React, { useMemo } from 'react'
import iso3311a2 from 'iso-3166-1-alpha-2'
import flags from 'country-flag-icons/react/3x2'
import { EmptyIcon, GeoIconWrapper } from 'src/components/Common/GeoIconCommon'

export interface GeoIconCountryProps {
  country: string
  size?: number
}

export function GeoIconCountry({ country, size = 18 }: GeoIconCountryProps) {
  const Icon = useMemo(() => {
    const countryCode = getCountryCode(country)
    return get(flags, countryCode, EmptyIcon)
  }, [country])
  return (
    <GeoIconWrapper $size={size}>
      <Icon />
    </GeoIconWrapper>
  )
}

function getCountryCode(country: string) {
  const code = MISSING_COUNTRY_CODES[country] ?? iso3311a2.getCode(country)
  if (code) {
    return code
  }
  if (country !== 'Other') {
    console.info(`Unable to find country code for '${country}'`)
  }
  return '??'
}

const MISSING_COUNTRY_CODES: Record<string, string> = {
  "Cote d'Ivoire": 'CI',
  "Côte d'Ivoire": 'CI',
  'Bolivia': 'BO',
  'Bonaire': 'BQ',
  'Brunei': 'BN',
  'Cabo Verde': 'CV',
  'Curacao': 'CW',
  'Democratic Republic of the Congo': 'CD',
  'Eswatini': 'SZ',
  'Iran': 'IR',
  'Kosovo': 'XK',
  'Kyrgyz Republic': 'KG',
  'Laos': 'LA',
  'Moldova': 'MD',
  'North Macedonia': 'MK',
  'Republic of the Congo': 'CD',
  'Russia': 'RU',
  'Saint Martin': 'SX',
  'Sint Maarten': 'SX',
  'South Korea': 'KR',
  'USA': 'US',
  'Venezuela': 'VE',
  'Vietnam': 'VN',
}
