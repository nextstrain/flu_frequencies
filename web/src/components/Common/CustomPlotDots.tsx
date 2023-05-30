import React from 'react'
import { useTheme } from 'styled-components'
import type { Props as DotProps } from 'recharts/types/shape/Dot'

const AREA_FACTOR = 0.6
const CIRCLE_LINEWIDTH = 2

export interface CustomizedDotProps extends DotProps {
  value: number
  payload: {
    counts: Record<string, number>
    ranges: Record<string, [number, number]>
    totals: Record<string, number>
  }
}

/** Line plot dot component which displays a bubble in proportion to frequency */
export function CustomizedDot(props: CustomizedDotProps) {
  const theme = useTheme()
  const y0 = theme.plot.margin.top

  const {
    cx,
    cy,
    stroke,
    name,
    payload: { counts, totals },
    height,
  } = props

  if (!name || typeof height != 'number' || !cy || totals[name] === 0) {
    // variant has not been observed in this region
    return null
  }

  const freq = counts[name] / totals[name] // observed frequency
  const cy2 = height * (1 - freq) + y0 // map obs. freq. to plot region
  const rad = AREA_FACTOR * Math.sqrt(totals[name]) // scale area to total counts in time window

  return (
    <>
      <circle cx={cx} cy={cy2} stroke={stroke} strokeWidth={CIRCLE_LINEWIDTH} fill="#ffffff88" r={rad} />
      <line x1={cx} y1={cy} x2={cx} y2={cy < cy2 ? cy2 - rad : cy2 + rad} stroke={stroke} strokeWidth={1} />
    </>
    // the line segment connects each dot to the linear trend as a color-accessible visual cue of variant id
  )
}

/**
 * Line plot active (on mouse hover) dot component which displays either a filled bubble in proportion to frequency
 * or a confidence line
 */
export function CustomizedActiveDot(props: CustomizedDotProps & { shouldShowDots: boolean }) {
  const theme = useTheme()
  const y0 = theme.plot.margin.top

  const {
    cx,
    cy,
    fill,
    name,
    payload: { counts, ranges, totals },
    value,
    shouldShowDots,
  } = props

  if (!name || !cy || totals[name] === 0) {
    return null // no variants observed in this region
  }

  const freq = counts[name] / totals[name] // observed frequency
  // map freq from (0,1) to plot region
  const cy2 = value === 1 ? y0 : ((cy - y0) * (1 - freq)) / (1 - value) + y0
  // display confidence interval as vertical line segment
  const [r1, r2] = ranges[name]

  return (
    <>
      {shouldShowDots && (
        <circle
          cx={cx}
          cy={cy2}
          stroke={fill}
          strokeWidth={1.5 * CIRCLE_LINEWIDTH}
          fill="#ffffff00"
          r={1 + AREA_FACTOR * Math.sqrt(counts[name])}
        />
      )}
      <line
        x1={cx}
        y1={value === 1 ? y0 : ((cy - y0) * (1 - r2)) / (1 - value) + y0}
        x2={cx}
        y2={value === 1 ? y0 : ((cy - y0) * (1 - r1)) / (1 - value) + y0}
        stroke={fill}
        strokeWidth={5}
      />
    </>
  )
}
