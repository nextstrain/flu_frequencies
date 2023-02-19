import { isEmpty } from 'lodash'
import Fuse from 'fuse.js'

export function fuzzySearch(items: string[], searchTerm: string) {
  if (isEmpty(searchTerm)) {
    return items.map((item) => ({ item, score: 1 }))
  }
  const fuse = new Fuse(items, {
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    shouldSort: true,
    findAllMatches: true,
  })
  return fuse.search(searchTerm)
}
