import { atom } from 'recoil'
import type { Pathogen } from 'src/io/getData'

export const pathogenAtom = atom<Pathogen>({
  key: 'pathogenAtom',
})
