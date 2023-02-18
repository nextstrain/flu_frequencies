import { atom } from 'recoil'
import { persistAtom } from 'src/state/persist/localStorage'

export const shouldShowRangesOnVariantsPlotAtom = atom({
  key: 'shouldShowRangesOnVariantsPlotAtom',
  default: false,
  effects: [persistAtom],
})
