import { isArray } from 'lodash-es'
import React, { ReactNode, useCallback } from 'react'
import Slider from 'rc-slider'
import type { MarkObj } from 'rc-slider/lib/Marks'
import styled from 'styled-components'
import { formatDateHumanely } from 'src/helpers/format'
import 'rc-slider/assets/index.css'

export interface DateSliderProps {
  minTimestamp: number
  maxTimestamp: number
  initialTimestampRange: number[]
  marks: Record<string | number, ReactNode | MarkObj>
  onDateRangeChange(range: number | number[]): void
}

export function DateSlider({
  minTimestamp,
  maxTimestamp,
  initialTimestampRange,
  marks,
  onDateRangeChange,
}: DateSliderProps) {
  const onChange = useCallback(
    (range: number | number[]) => {
      if (isArray(range)) {
        onDateRangeChange(range)
      }
    },
    [onDateRangeChange],
  )

  return (
    <DateSliderOuter>
      <DateSliderTextWrapper>
        <DateSliderText>{formatDateHumanely(minTimestamp)}</DateSliderText>
      </DateSliderTextWrapper>
      <DateSliderWrapper>
        <Slider
          range
          min={minTimestamp}
          max={maxTimestamp}
          marks={marks}
          defaultValue={initialTimestampRange}
          onChange={onChange}
          step={null}
          allowCross={false}
          {...dateSliderStyle}
        />
      </DateSliderWrapper>
      <DateSliderTextWrapper>
        <DateSliderText>{formatDateHumanely(maxTimestamp)}</DateSliderText>
      </DateSliderTextWrapper>
    </DateSliderOuter>
  )
}

const DateSliderOuter = styled.div`
  display: flex;
  flex: 0 0 40px;
`

const DateSliderWrapper = styled.div`
  flex: 1 0 60px;
  margin: 0.33rem 0;

  .rc-slider-mark {
    display: none;
  }
`

const DateSliderTextWrapper = styled.div`
  display: flex;
  flex: 0 0 100px;
  margin: 0 auto;
`

const DateSliderText = styled.span`
  font-size: 0.8rem;
  margin: auto;
  margin-bottom: 0.9rem;
`

const dateSliderStyle = {
  railStyle: { height: 10 },
  trackStyle: { height: 10 },
  dotStyle: { display: 'none' },
  activeDotStyle: { display: 'none' },
  handleStyle: { height: 20, width: 20 },
}
