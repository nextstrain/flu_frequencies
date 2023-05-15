import { atom } from 'recoil'
import { persistAtom } from 'src/state/persist/localStorage'

export const shouldShowRangesOnVariantsPlotAtom = atom({
  key: 'shouldShowRangesOnVariantsPlotAtom',
  default: false,
  effects: [persistAtom],
})

export const shouldShowRangesOnRegionsPlotAtom = atom({
  key: 'shouldShowRangesOnRegionsPlotAtom',
  default: false,
  effects: [persistAtom],
})

export const shouldShowDotsOnRegionsPlotAtom = atom({
  key: 'shouldShowDotsOnRegionsPlotAtom',
  default: true,
  effects: [persistAtom]
})

export const isSidebarSettingsCollapsedAtom = atom({
  key: 'isSidebarSettingsCollapsedAtom',
  default: false,
  effects: [persistAtom],
})
