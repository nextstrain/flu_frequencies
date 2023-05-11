import React, { HTMLAttributes, PropsWithChildren } from 'react'
import { isNil, noop } from 'lodash-es'
import NextLink, { LinkProps as NextLinkProps } from 'next/link'
import { StrictOmit } from 'ts-essentials'
import { Button, ButtonProps } from 'reactstrap'

export interface LinkProps
  extends StrictOmit<PropsWithChildren<NextLinkProps & HTMLAttributes<HTMLAnchorElement>>, 'href'> {
  href?: string
  className?: string
}

export function Link({ className, children, href, onClick, ...restProps }: LinkProps) {
  if (isNil(href)) {
    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
      <a {...restProps} className={className} onClick={noop}>
        {children}
      </a>
    )
  }

  return (
    <NextLink {...restProps} href={href} passHref={false} className={className} onClick={onClick}>
      {children}
    </NextLink>
  )
}

export interface LinkLookingLikeButtonProps extends PropsWithChildren<ButtonProps> {
  href?: string
}

export function LinkLookingLikeButton({ href, children, ...restProps }: LinkLookingLikeButtonProps) {
  return (
    <Link href={href} passHref legacyBehavior>
      <Button {...restProps}>{children}</Button>
    </Link>
  )
}
