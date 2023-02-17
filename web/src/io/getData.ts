import { get } from 'lodash'
import urljoin from 'url-join'
import { useAxiosQueries, useAxiosQuery } from 'src/hooks/useAxiosQuery'
import { getDataRootUrl } from 'src/io/getDataRootUrl'

export interface Pathogen {
  name: string
  nameFriendly: string
}

export interface RegionsData {
  regions: string[]
  countries: string[]
  regionsHierarchy: Record<string, string[]>
  regionsStyles: Record<string, ItemStyle>
}

export interface VariantDatum {
  region: string
  country: string | null
  date: string
  freqHi: number
  freqLo: number
  freqMi: number
}

export interface VariantDataJson {
  variant: string
  values: VariantDatum[]
}

export function useVariantDataQuery(
  pathogenName: string,
  variantName: string,
): { variantData: VariantDataJson; regionsData: RegionsData } {
  return useAxiosQueries({
    variantData: urljoin(getDataRootUrl(), 'pathogens', pathogenName, 'variants', `${variantName}.json`),
    regionsData: urljoin(getDataRootUrl(), 'pathogens', pathogenName, 'regions.json'),
  })
}

export function useRegionsDataQuery(pathogenName: string): RegionsData {
  return useAxiosQuery(urljoin(getDataRootUrl(), 'pathogens', pathogenName, 'regions.json'))
}

export function usePathogenQuery(pathogenName: string): Pathogen {
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

export interface ItemStyleInternal {
  color: string
  lineStyle: string
  strokeDashArray: string | undefined
}

export function useCountryStyle(pathogenName: string, countryName: string): ItemStyleInternal {
  const { regionsStyles } = useRegionsDataQuery(pathogenName)
  return getCountryStyle(regionsStyles, countryName)
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
}

export function useVariantsDataQuery(pathogenName: string): VariantsJson {
  return useAxiosQuery(urljoin(getDataRootUrl(), 'pathogens', pathogenName, 'variants.json'))
}
