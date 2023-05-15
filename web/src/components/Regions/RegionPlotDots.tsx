import React, { FunctionComponent } from 'react'

const area_factor = 0.6
const circle_linewidth = 2

// add points with area in proportion to variant count
// eslint-disable-next-line @typescript-eslint/no-explicit-any, react/function-component-definition
export const CustomizedDot: FunctionComponent<any> = (props: any) => {
  const { cx, cy, stroke, name, payload, height } = props
  if (payload.totals[name] === 0) {
    // variant has not been observed in this region
    return null
  }

  const ev = payload.counts[name] / payload.totals[name] // empirical value (freq)
  const y0 = 32 // FIXME: top margin - need to pass from parent
  const cy2 = height * (1 - ev) + y0  // observed frequency
  const rad = 1 + area_factor * Math.sqrt(payload.counts[name])  // scale area to observed count

  return (
    <>
      <circle cx={cx} cy={cy2} stroke={stroke} strokeWidth={circle_linewidth} fill="#ffffff88" r={rad} />
      <line x1={cx} y1={cy} x2={cx} y2={cy < cy2 ? cy2 - rad : cy2 + rad} stroke={stroke} strokeWidth={1} />
    </>
    // the line segment connects each dot to the linear trend as a color-accessible visual cue of variant id
  )
}

// bind mouseover event to display confidence interval or highlight dot
// eslint-disable-next-line @typescript-eslint/no-explicit-any, react/function-component-definition
export const CustomizedActiveDot: FunctionComponent<any> = (props: any) => {
  // console.log(props);
  const { cx, cy, fill, name, payload, value, shouldShowDots } = props
  const y0 = 32 // FIXME: top margin - need to pass from parent

  if (payload.totals[name] === 0) {
    // no counts, no meaningful empirical frequencies can be displayed
    return null
  }

  const ev = payload.counts[name] / payload.totals[name] // empirical value
  // map ev from (0,1) to plot region
  const cy2 = value === 1 ? y0 : ((cy - y0) * (1 - ev)) / (1 - value) + y0
  // display confidence interval as vertical line segment
  const r1 = payload.ranges[name][0]
  const r2 = payload.ranges[name][1]

  return (
    <>
      {shouldShowDots && 
            <circle
            cx={cx}
            cy={cy2}
            stroke={fill}
            strokeWidth={1.5*circle_linewidth}
            fill="#ffffff00"
            r={1 + area_factor * Math.sqrt(payload.counts[name])}
          />
      }
      <line
        x1={cx}
        y1={((cy - y0) * (1 - r2)) / (1 - value) + y0}
        x2={cx}
        y2={((cy - y0) * (1 - r1)) / (1 - value) + y0}
        stroke={fill}
        strokeWidth={5}
      />
    </>
  )
}
