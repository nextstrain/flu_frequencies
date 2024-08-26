import React, { useMemo } from 'react'
import { useResizeDetector } from 'react-resize-detector'
import styled from 'styled-components'
import type { ResizeDetectorProps } from 'react-resize-detector'
import { useInView } from 'react-intersection-observer'
import { theme } from 'src/theme'

export interface ChartContainerDimensions {
  width: number
  height: number
}

export interface ChartContainerProps {
  resizeOptions?: ResizeDetectorProps<HTMLDivElement>
  children: (dimensions: ChartContainerDimensions) => React.ReactNode
}

export function ChartContainer({ children, resizeOptions }: ChartContainerProps) {
  const { width, ref: resizeRef } = useResizeDetector({
    handleWidth: true,
    refreshRate: 100,
    refreshMode: 'debounce',
    skipOnMount: false,
    ...resizeOptions,
  })

  const { inView, ref: intersectionRef } = useInView({
    rootMargin: '500px',
    initialInView: false,
    fallbackInView: true,
    // triggerOnce: true,
  })

  const dimensions = useMemo(() => ({ width: width ?? 0, height: (width ?? 0) / theme.plot.aspectRatio }), [width])

  const childrenWithDims = useMemo(() => {
    if (!inView) {
      return null
    }
    return children(dimensions)
  }, [children, dimensions, inView])

  return (
    <PlotWrapper ref={resizeRef}>
      <PlotWrapperInner ref={intersectionRef}>{childrenWithDims}</PlotWrapperInner>
    </PlotWrapper>
  )
}

const PlotWrapper = styled.div`
  flex: 1;
  width: 100%;
`

const PlotWrapperInner = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  aspect-ratio: ${(props) => props.theme.plot.aspectRatio};
`
