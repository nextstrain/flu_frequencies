import copy from 'fast-copy'
import { atomFamily, selector, selectorFamily } from 'recoil'
import { axiosFetch } from 'src/io/axiosFetch'
import { VariantsData } from 'src/io/getData'
import { getDataRootUrl } from 'src/io/getDataRootUrl'
import urljoin from 'url-join'
import { isDefaultValue } from 'src/state/utils/isDefaultValue'
import { CheckboxState } from 'src/components/Common/Checkbox'

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

function isEnabledAll<T extends { enabled: boolean }>(items: T[]) {
  return items.every((item) => item.enabled)
}

function isDisabledAll<T extends { enabled: boolean }>(items: T[]) {
  return items.every((item) => !item.enabled)
}

function setEnabledAll<T extends { enabled: boolean }>(items: T[], enabled: boolean) {
  return items.map((item) => ({ ...item, enabled }))
}

export const variantsEnableAllAtom = selectorFamily<CheckboxState, string>({
  key: 'variantsEnableAllAtom',
  get:
    (region) =>
    ({ get }) => {
      const variants = get(variantsAtom(region))
      if (isEnabledAll(variants)) {
        return CheckboxState.Checked
      }
      if (isDisabledAll(variants)) {
        return CheckboxState.Unchecked
      }
      return CheckboxState.Indeterminate
    },
  set:
    (region) =>
    ({ get, set, reset }, value) => {
      if (isDefaultValue(value)) {
        reset(variantsAtom(region))
      } else if (value === CheckboxState.Checked) {
        set(variantsAtom(region), setEnabledAll(get(variantsAtom(region)), true))
      } else if (value === CheckboxState.Unchecked) {
        set(variantsAtom(region), setEnabledAll(get(variantsAtom(region)), false))
      }
    },
})
