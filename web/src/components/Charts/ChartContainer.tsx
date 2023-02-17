import React, { ReactNode, useMemo } from 'react'
import { useResizeDetector } from 'react-resize-detector'
import styled from 'styled-components'
import { Props as ResizeDetectorProps } from 'react-resize-detector/build/ResizeDetector'
import { useInView } from 'react-intersection-observer'
import { theme } from 'src/theme'
import { FadeIn } from './FadeIn'

type ChartContainerDimensions = {
  width: number
  height: number
}

export interface ChartContainerProps extends ResizeDetectorProps {
  resizeOptions?: ResizeDetectorProps
  children: (dimensions: ChartContainerDimensions) => ReactNode
}

export function ChartContainer({ children, ...restProps }: ChartContainerProps) {
  const { width = 0, ref: resizeRef } = useResizeDetector({ handleWidth: true, ...restProps })
  const { inView, ref: intersectionRef } = useInView({ fallbackInView: true })
  const dimensions = useMemo(() => ({ width, height: width / theme.plot.aspectRatio }), [width])
  const childrenWithDims = useMemo(() => children(dimensions), [children, dimensions])

  return (
    <ChartContainerOuter ref={resizeRef}>
      <ChartContainerInner>
        <div ref={intersectionRef} style={dimensions}>
          {inView && <FadeIn>{childrenWithDims}</FadeIn>}
        </div>
      </ChartContainerInner>
    </ChartContainerOuter>
  )
}

export const ChartContainerOuter = styled.div`
  display: flex;
  justify-content: space-evenly;
  width: 100%;
`

export const ChartContainerInner = styled.div`
  flex: 0 1 100%;
  width: 0;
`
