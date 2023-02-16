import { MDXProviderComponents } from '@mdx-js/react'
import styled, { css } from 'styled-components'

import { LinkSmart } from 'src/components/Link/LinkSmart'

export const CodeCommon = css`
  padding: 1px 5px;
  border-radius: 2px;
  background-color: ${(props) => props.theme.code.pre.background};
`

export const Pre = styled.pre`
  padding: 0.5rem 1rem;
  ${CodeCommon};
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
`

export const Code = styled.code`
  ${CodeCommon};
`

const P = styled.p`
  & > code {
    ${CodeCommon};
  }
`

export const mdxComponents = {
  a: LinkSmart,
  pre: Pre,
  code: Code,
  p: P,
}

export function getMdxComponents(components: MDXProviderComponents): MDXProviderComponents {
  return { ...components, ...mdxComponents }
}
