import { DateTime, DurationLike } from 'luxon'

export const formatProportion = (value: number) => value.toFixed(2)

export const formatInteger = (value: number) => value.toFixed(0)

export const formatDate = (date: number) => DateTime.fromSeconds(date).toISODate()

export function timestampToDate(seconds: number) {
  return DateTime.fromSeconds(seconds)
}

export function formatDateRange(weekTimestamp: number, range: DurationLike) {
  const begin = DateTime.fromSeconds(weekTimestamp)
  const end = begin.plus(range)
  return `${begin.toFormat('dd MMM yyyy')} - ${end.toFormat('dd MMM yyyy')}`
}

export function formatDateWeekly(weekTimestamp: number) {
  return formatDateRange(weekTimestamp, { weeks: 1 })
}

export function formatDateBiweekly(weekTimestamp: number) {
  return formatDateRange(weekTimestamp, { weeks: 2 })
}

export const formatDateHumanely = (date: number) =>
  DateTime.fromSeconds(date).toLocaleString({ month: 'short', year: '2-digit' }).replace(' ', '\n')

export function dateFromYmd(ymd: string): DateTime {
  return DateTime.fromFormat(ymd, 'yyyy-MM-dd')
}

export function ymdToTimestamp(ymd: string): number {
  return dateFromYmd(ymd).toSeconds()
}
