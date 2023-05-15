import React from 'react'

const area_factor = 0.6
const circle_linewidth = 2

// Line plot dot component which displays a bubble in proportion to frequency
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CustomizedDot(props: any) {
  const { cx, cy, stroke, name, payload, height } = props
  if (payload.totals[name] === 0) {
    // variant has not been observed in this region
    return null
  }

  const ev = payload.counts[name] / payload.totals[name] // empirical value (freq)
  const y0 = 32 // FIXME: top margin - need to pass from parent

  // FIXME: fails if value = 1
  // const cy2 = (cy-y0)*(1-ev)/(1-value) + y0;  // empirical val mapped to plot region
  const cy2 = height * (1 - ev) + y0

  const rad = 1 + area_factor * Math.sqrt(payload.counts[name])

  return (
    <>
      <circle cx={cx} cy={cy2} stroke={stroke} strokeWidth={circle_linewidth} fill="#ffffff88" r={rad} />
      <line x1={cx} y1={cy} x2={cx} y2={cy < cy2 ? cy2 - rad : cy2 + rad} stroke={stroke} strokeWidth={1} />
    </>
  )
}

// Line plot active (on mouse hover) dot component which displays either a bubble in proportion to frequency or a confidence line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CustomizedActiveDot(props: any) {
  const { cx, cy, fill, name, payload, value, shouldShowRanges } = props
  const y0 = 32 // FIXME: top margin - need to pass from parent

  if (shouldShowRanges) {
    // confidence intervals already displayed as shaded areas, fill circles instead
    if (payload.totals[name] === 0) {
      // no counts, no meaningful empirical frequencies can be displayed
      return null
    }

    const ev = payload.counts[name] / payload.totals[name] // empirical value
    // map ev from (0,1) to plot region
    const cy2 = value === 1 ? y0 : ((cy - y0) * (1 - ev)) / (1 - value) + y0

    return (
      <circle
        cx={cx}
        cy={cy2}
        stroke={fill}
        strokeWidth={circle_linewidth}
        fill={fill}
        r={1 + area_factor * Math.sqrt(payload.counts[name])}
      />
    )
  }

  // display confidence interval as vertical line segment
  const r1 = payload.ranges[name][0]
  const r2 = payload.ranges[name][1]

  return (
    <line
      x1={cx}
      y1={((cy - y0) * (1 - r2)) / (1 - value) + y0}
      x2={cx}
      y2={((cy - y0) * (1 - r1)) / (1 - value) + y0}
      stroke={fill}
      strokeWidth={5}
    />
  )
}
