import copy from 'fast-copy'
import { atom, atomFamily, selector, selectorFamily } from 'recoil'
import { axiosFetch } from 'src/io/axiosFetch'
import { GeographyData } from 'src/io/getData'
import { getDataRootUrl } from 'src/io/getDataRootUrl'
import urljoin from 'url-join'
import { isDefaultValue } from 'src/state/utils/isDefaultValue'
import { CheckboxState } from 'src/components/Common/Checkbox'

const geographyAtom = atomFamily<GeographyData, string>({
  key: 'geographyAtom',
  default: (pathogenName: string) =>
    axiosFetch<GeographyData>(urljoin(getDataRootUrl(), 'pathogens', pathogenName, 'geography.json')),
})

function getAllContinentNames(geography: GeographyData) {
  return geography.regions
}

export const continentsAtom = atomFamily<{ name: string; enabled: boolean }[], string>({
  key: 'continentsAtom',
  default: (pathogen) =>
    selector({
      key: `continentsAtom/default/${pathogen}`,
      get({ get }) {
        return getAllContinentNames(get(geographyAtom(pathogen))).map((name) => ({ name, enabled: true }))
      },
    }),
})

export const continentAtom = selectorFamily<boolean, { pathogen: string; continent: string }>({
  key: 'continentAtom',
  get:
    ({ pathogen, continent }) =>
    ({ get }) => {
      return get(continentsAtom(pathogen)).find((candidate) => candidate.name === continent)?.enabled ?? false
    },
  set:
    ({ pathogen, continent }) =>
    ({ get, set, reset }, enabled) => {
      if (isDefaultValue(enabled)) {
        reset(continentsAtom(pathogen))
      } else {
        const continents = copy(get(continentsAtom(pathogen)))
        continents.forEach((item) => {
          if (item.name === continent) {
            item.enabled = enabled
          }
        })
        set(continentsAtom(pathogen), continents)
      }
    },
})

function getAllCountryNames(geography: GeographyData) {
  return geography.countries
}

export const countriesAtom = atomFamily<{ name: string; enabled: boolean }[], string>({
  key: 'countriesAtom',
  default: (pathogen) =>
    selector({
      key: `countriesAtom/default/${pathogen}`,
      get({ get }) {
        return getAllCountryNames(get(geographyAtom(pathogen))).map((name) => ({ name, enabled: false }))
      },
    }),
})

export const countryAtom = selectorFamily<boolean, { pathogen: string; country: string }>({
  key: 'countryAtom',
  get:
    ({ pathogen, country }) =>
    ({ get }) => {
      return get(countriesAtom(pathogen)).find((candidate) => candidate.name === country)?.enabled ?? false
    },
  set:
    ({ pathogen, country }) =>
    ({ get, set, reset }, enabled) => {
      if (isDefaultValue(enabled)) {
        reset(countriesAtom(pathogen))
      } else {
        const countries = copy(get(countriesAtom(pathogen)))
        countries.forEach((item) => {
          if (item.name === country) {
            item.enabled = enabled
          }
        })
        set(countriesAtom(pathogen), countries)
      }
    },
})

export const geographyEnabledAtom = selectorFamily<{ name: string; enabled: boolean }[], string>({
  key: 'geographyAtom',
  get:
    (pathogen) =>
    ({ get }) => {
      const countries = get(countriesAtom(pathogen))
      const regions = get(continentsAtom(pathogen))
      return [...regions, ...countries]
    },
})

function isEnabledAll<T extends { enabled: boolean }>(items: T[]) {
  return items.every((item) => item.enabled)
}

function isDisabledAll<T extends { enabled: boolean }>(items: T[]) {
  return items.every((item) => !item.enabled)
}

function setEnabledAll<T extends { enabled: boolean }>(items: T[], enabled: boolean) {
  return items.map((item) => ({ ...item, enabled }))
}

export const geographyEnableAllAtom = selectorFamily<CheckboxState, string>({
  key: 'geographyEnableAllAtom',
  get:
    (pathogen) =>
    ({ get }) => {
      const countries = get(countriesAtom(pathogen))
      const regions = get(continentsAtom(pathogen))
      const locations = [...regions, ...countries]
      if (isEnabledAll(locations)) {
        return CheckboxState.Checked
      }
      if (isDisabledAll(locations)) {
        return CheckboxState.Unchecked
      }
      return CheckboxState.Indeterminate
    },
  set:
    (pathogen) =>
    ({ get, set, reset }, value) => {
      if (isDefaultValue(value)) {
        reset(countriesAtom(pathogen))
        reset(continentsAtom(pathogen))
      } else if (value === CheckboxState.Checked) {
        set(countriesAtom(pathogen), setEnabledAll(get(countriesAtom(pathogen)), true))
        set(continentsAtom(pathogen), setEnabledAll(get(continentsAtom(pathogen)), true))
      } else if (value === CheckboxState.Unchecked) {
        set(countriesAtom(pathogen), setEnabledAll(get(countriesAtom(pathogen)), false))
        set(continentsAtom(pathogen), setEnabledAll(get(continentsAtom(pathogen)), false))
      }
    },
})

export const geographySearchTermAtom = atom({
  key: 'geographySearchTermAtom',
  default: '',
})

export const variantsSearchTermAtom = atom({
  key: 'variantsSearchTermAtom',
  default: '',
})
