import { isArray } from 'lodash-es'
import React, { CSSProperties, ReactNode, useCallback, useMemo } from 'react'
import { useRecoilValue } from 'recoil'
import Slider from 'rc-slider'
import type { MarkObj } from 'rc-slider/lib/Marks'
import styled, { useTheme } from 'styled-components'
import { formatDateHumanely } from 'src/helpers/format'
import 'rc-slider/assets/index.css'
import { Theme } from 'src/theme'
import { localeAtom } from 'src/state/locale.state'

export interface DateSliderProps {
  range: [number, number]
  initialRange: [number, number]
  fullRange: [number, number]
  marks: Record<string | number, ReactNode | MarkObj>
  onDateRangeChange(range: number | number[]): void
}

export function DateSlider({ range, fullRange, initialRange, marks, onDateRangeChange }: DateSliderProps) {
  const theme = useTheme()
  const locale = useRecoilValue(localeAtom)

  const onChange = useCallback(
    (range: number | number[]) => {
      if (isArray(range)) {
        onDateRangeChange(range)
      }
    },
    [onDateRangeChange],
  )

  const dateSliderStyle = useMemo(() => getDateSliderStyle(theme), [theme])

  return (
    <DateSliderOuter>
      <DateSliderTextWrapper>
        <DateSliderText>{formatDateHumanely(locale)(range[0])}</DateSliderText>
      </DateSliderTextWrapper>
      <DateSliderWrapper>
        <Slider
          range
          min={fullRange[0]}
          max={fullRange[1]}
          marks={marks}
          value={range}
          defaultValue={initialRange}
          onChange={onChange}
          step={null}
          allowCross={false}
          {...dateSliderStyle}
        />
      </DateSliderWrapper>
      <DateSliderTextWrapper>
        <DateSliderText>{formatDateHumanely(locale)(range[1])}</DateSliderText>
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

function getDateSliderStyle(theme: Theme): Record<string, CSSProperties> {
  return {
    railStyle: { height: 10, backgroundColor: theme.gray300 },
    trackStyle: { height: 10, backgroundColor: theme.primary },
    dotStyle: { display: 'none' },
    activeDotStyle: { display: 'none' },
    handleStyle: { height: 20, width: 20, borderColor: theme.primary, borderWidth: 1 },
  }
}
