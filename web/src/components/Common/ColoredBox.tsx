import styled from 'styled-components'

export const ColoredBox = styled.div<{ $color: string; $size: number; $aspect?: number }>`
  display: inline-block;
  padding: 0;
  margin: auto;
  margin-right: ${(props) => props.$size / 2}px;
  background-color: ${(props) => props.$color};
  width: ${(props) => props.$size * (props.$aspect ?? 1)}px;
  height: ${(props) => props.$size}px;
  border-radius: 2px;
`
