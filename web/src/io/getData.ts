import { get } from 'lodash-es'
import urljoin from 'url-join'
import { useAxiosQueries, useAxiosQuery } from 'src/hooks/useAxiosQuery'
import { getDataRootUrl } from 'src/io/getDataRootUrl'

export interface Pathogen {
  isEnabled: boolean
  name: string
  nameFriendly: string
  nCountries: number
  nRegions: number
  nVariants: number
  color: string
  maxDate: ''
  minDate: ''
  image: {
    credit: string
    file: string
    source: string
  }
}

export interface GeographyData {
  regions: string[]
  countries: string[]
  geography: Record<string, string[]>
  geographyStyles: Record<string, ItemStyle>
}

export interface VariantsData {
  variants: string[]
  variantsStyles: Record<string, ItemStyle>
}

export interface VariantDatum {
  region: string
  country: string | null
  date: string
  freqHi: number
  freqLo: number
  freqMi: number
  count: number
  total: number
}

export interface VariantDataJson {
  variant: string
  values: VariantDatum[]
}

export function useVariantDataQuery(
  pathogenName: string,
  variantName: string,
): { variantData: VariantDataJson; regionsData: GeographyData } {
  return useAxiosQueries({
    variantData: urljoin(getDataRootUrl(), 'pathogens', pathogenName, 'variants', `${variantName}.json`),
    regionsData: urljoin(getDataRootUrl(), 'pathogens', pathogenName, 'geography.json'),
  })
}

export interface RegionDatum {
  variant: string
  date: string
  freqHi: number
  freqLo: number
  freqMi: number
  count: number
  total: number
}

export interface RegionDataJson {
  variant: string
  values: RegionDatum[]
}

export function useRegionDataQuery(
  pathogenName: string,
  countryName: string,
): { regionData: RegionDataJson; variantsData: VariantsData } {
  return useAxiosQueries({
    regionData: urljoin(getDataRootUrl(), 'pathogens', pathogenName, 'geography', `${countryName}.json`),
    variantsData: urljoin(getDataRootUrl(), 'pathogens', pathogenName, 'variants.json'),
  })
}

export function useRegionsDataQuery(pathogenName: string): GeographyData {
  return useAxiosQuery(urljoin(getDataRootUrl(), 'pathogens', pathogenName, 'geography.json'))
}

export function usePathogen(pathogenName: string): Pathogen {
  return useAxiosQuery(urljoin(getDataRootUrl(), 'pathogens', pathogenName, 'pathogen.json'))
}

export interface ItemStyle {
  color: string
  lineStyle: string
}

const DEFAULT_ITEM_STYLE: ItemStyle = {
  color: '#555555',
  lineStyle: 'normal',
}

export interface ItemStyleInternal extends ItemStyle {
  color: string
  lineStyle: string
  strokeDashArray: string | undefined
}

export function useCountryStyle(pathogenName: string, countryName: string): ItemStyleInternal {
  const { geographyStyles } = useRegionsDataQuery(pathogenName)
  return getCountryStyle(geographyStyles, countryName)
}

export function useVariantStyle(pathogenName: string, variantName: string): ItemStyleInternal {
  const { variantsStyles } = useVariantsDataQuery(pathogenName)
  return getCountryStyle(variantsStyles, variantName)
}

export function getCountryStyle(regionsStyles: Record<string, ItemStyle>, countryName: string) {
  const { color, lineStyle } = get<Record<string, ItemStyle>, string>(regionsStyles, countryName) ?? DEFAULT_ITEM_STYLE
  return { color, lineStyle, strokeDashArray: lineStyleToStrokeDashArray(lineStyle) }
}

export function getCountryColor(regionsStyles: Record<string, ItemStyle>, countryName: string) {
  return getCountryStyle(regionsStyles, countryName).color
}

export function getCountryStrokeDashArray(regionsStyles: Record<string, ItemStyle>, countryName: string) {
  return getCountryStyle(regionsStyles, countryName).strokeDashArray
}

export const LINE_STYLES: Record<string, string | undefined> = {
  '-': undefined,
  '--': '8 6',
  '.': '16 2 2 3',
  ':': '3 3',
  '-.': '5 3 2 3 2 3',
}
export const LINE_STYLE_SYNONYMS: Record<string, string> = {
  normal: '-',
  dashed: '--',
  dotted: '.',
}

export function lineStyleToStrokeDashArray(lineStyle: string): string | undefined {
  const style = get(LINE_STYLE_SYNONYMS, lineStyle, lineStyle)
  return get<typeof LINE_STYLES, string>(LINE_STYLES, style) ?? undefined
}

export interface VariantsJson {
  variants: string[]
  variantsStyles: Record<string, ItemStyle>
}

export function useVariantsDataQuery(pathogenName: string): VariantsJson {
  return useAxiosQuery(urljoin(getDataRootUrl(), 'pathogens', pathogenName, 'variants.json'))
}
