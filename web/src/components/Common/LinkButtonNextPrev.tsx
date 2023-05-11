import React from 'react'
import styled from 'styled-components'
import {
  LinkLookingLikeButton as LinkLookingLikeButtonBase,
  LinkLookingLikeButtonProps,
} from 'src/components/Link/Link'
import { BsCaretLeftFill as ArrowLeftBase, BsCaretRightFill as ArrowRightBase } from 'react-icons/bs'

const ARROW_SIZE = 10

export interface LinkButtonNextProps extends LinkLookingLikeButtonProps {
  text: string
}

export function LinkButtonNext({ href, text, ...restProps }: LinkButtonNextProps) {
  return (
    <LinkLookingLikeButton href={href} {...restProps}>
      {text}
      <ArrowRight size={ARROW_SIZE} />
    </LinkLookingLikeButton>
  )
}

export interface LinkButtonPrevProps extends LinkLookingLikeButtonProps {
  text: string
}

export function LinkButtonPrev({ href, text, ...restProps }: LinkButtonPrevProps) {
  return (
    <LinkLookingLikeButton href={href} {...restProps}>
      <ArrowLeft size={ARROW_SIZE} />
      {text}
    </LinkLookingLikeButton>
  )
}

const LinkLookingLikeButton = styled(LinkLookingLikeButtonBase)`
  padding: 0.2rem 0.3rem;
  min-width: 120px;
  font-size: 0.8rem;
  border-radius: 2px;
`

const ArrowRight = styled(ArrowRightBase)`
  margin-bottom: 2px;
  margin-left: 0.25rem;
  fill: ${(props) => props.theme.gray650};
`

const ArrowLeft = styled(ArrowLeftBase)`
  margin-bottom: 2px;
  margin-right: 0.25rem;
  fill: ${(props) => props.theme.gray650};
`
