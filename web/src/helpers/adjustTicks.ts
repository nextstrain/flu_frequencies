import { DateTime, Interval } from 'luxon'

/** Returns an array containing only every n-th element of the original array */
export function everyNth<T>(arr: T[], every: number) {
  return arr.filter((_0, index) => index % every === 0)
}

/** Returns every n-th tick depending on available width and tick width */
export function adjustTicks(ticks: number[], availableWidth: number, tickWidth: number) {
  const tickCountDesired = Math.round(availableWidth / tickWidth)
  const interval = Math.ceil(ticks.length / tickCountDesired)
  return everyNth(ticks, interval)
}

export function calculateTicks(minDate: DateTime, maxDate: DateTime, availableWidth: number, tickWidth: number) {
  const ticks = Interval.fromDateTimes(minDate.startOf('month'), maxDate.endOf('month'))
    .splitBy({ months: 1 })
    .map((d) => d.start.toSeconds())
    .filter((d) => d >= minDate.toSeconds() && d <= maxDate.toSeconds())

  const adjustedTicks = adjustTicks(ticks, availableWidth, tickWidth)
  const domainX = [minDate.toSeconds(), maxDate.toSeconds()]
  const domainY = [0, 1]
  return { adjustedTicks, domainX, domainY }
}
