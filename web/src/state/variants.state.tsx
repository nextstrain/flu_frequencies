import copy from 'fast-copy'
import { atomFamily, selector, selectorFamily } from 'recoil'
import { axiosFetch } from 'src/io/axiosFetch'
import { VariantsData } from 'src/io/getData'
import { getDataRootUrl } from 'src/io/getDataRootUrl'
import urljoin from 'url-join'
import { isDefaultValue } from 'src/state/utils/isDefaultValue'
import { ErrorInternal } from 'src/helpers/ErrorInternal'

const variantDataAtom = atomFamily<VariantsData, string>({
  key: 'variantDataAtom',
  default: (pathogenName: string) =>
    axiosFetch<VariantsData>(urljoin(getDataRootUrl(), 'pathogens', pathogenName, 'variants.json')),
})

function getAllVariantNames(variants: VariantsData) {
  return variants.variants
}

export const variantsAtom = atomFamily<{ name: string; enabled: boolean }[], string>({
  key: 'variantsAtom',
  default: (pathogen) =>
    selector({
      key: `variantsAtom/default/${pathogen}`,
      get({ get }) {
        return getAllVariantNames(get(variantDataAtom(pathogen))).map((name) => ({ name, enabled: true }))
      },
    }),
})

export const variantAtom = selectorFamily<boolean, { pathogen: string; variant: string }>({
  key: 'variantAtom',
  get:
    ({ pathogen, variant }) =>
    ({ get }) => {
      return get(variantsAtom(pathogen)).find((candidate) => candidate.name === variant)?.enabled ?? false
    },
  set:
    ({ pathogen, variant }) =>
    ({ get, set, reset }, enabled) => {
      if (isDefaultValue(enabled)) {
        reset(variantsAtom(pathogen))
      } else {
        const countries = copy(get(variantsAtom(pathogen)))
        countries.forEach((item) => {
          if (item.name === variant) {
            item.enabled = enabled
          }
        })
        set(variantsAtom(pathogen), countries)
      }
    },
})

function setEnabledAll<T extends { enabled: boolean }>(items: T[], enabled: boolean) {
  return items.map((item) => ({ ...item, enabled }))
}

export const variantsEnableAllAtom = selectorFamily<unknown, string>({
  key: 'variantsEnableAllAtom',
  get() {
    throw new ErrorInternal("Attempt to read from write-only atom: 'variantsEnableAllAtom'")
  },
  set:
    (region) =>
    ({ get, set }) => {
      set(variantsAtom(region), setEnabledAll(get(variantsAtom(region)), true))
    },
})

export const variantsDisableAllAtom = selectorFamily<unknown, string>({
  key: 'variantsDisableAllAtom',
  get() {
    throw new ErrorInternal("Attempt to read from write-only atom: 'variantsDisableAllAtom'")
  },
  set:
    (region) =>
    ({ get, set }) => {
      set(variantsAtom(region), setEnabledAll(get(variantsAtom(region)), false))
    },
})
