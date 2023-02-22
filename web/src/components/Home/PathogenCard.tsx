import React, { useMemo } from 'react'
import styled from 'styled-components'
import { Card as CardBase, CardBody as CardBodyBase, CardFooter as CardFooterBase } from 'reactstrap'
import type { Pathogen } from 'src/io/getData'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { Link } from 'src/components/Link/Link'
import { getDataRootUrl } from 'src/io/getDataRootUrl'
import urlJoin from 'url-join'

export interface PathogenCardProps {
  pathogen: Pathogen
}

export function PathogenCard({ pathogen }: PathogenCardProps) {
  const { t } = useTranslationSafe()
  const href = useMemo(
    () => (pathogen.isEnabled ? `/pathogen/${pathogen.name}/variants` : undefined),
    [pathogen.isEnabled, pathogen.name],
  )
  const overlay = useMemo(() => {
    if (!pathogen.isEnabled) {
      return <OverlayDisabled />
    }
    return null
  }, [pathogen.isEnabled])

  const imgUrl = useMemo(() => urlJoin(getDataRootUrl(), pathogen.image.file), [pathogen.image.file])

  return (
    <Link href={href} title={pathogen.nameFriendly} className="text-decoration-none">
      <Card $disabled={!pathogen.isEnabled}>
        <CardBody>
          <Img alt={pathogen.nameFriendly} src={imgUrl} />
          {overlay}
        </CardBody>
        <CardFooter>
          <PathogenName $color={pathogen.color}>{t(pathogen.nameFriendly)}</PathogenName>
        </CardFooter>
      </Card>
    </Link>
  )
}

const Card = styled(CardBase)<{ $disabled?: boolean }>`
  margin: 0.75rem 0.5rem;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  box-shadow: ${(props) => props.theme.shadows.blurredMedium};

  :hover {
    ${(props) =>
      !props.$disabled &&
      `
    scale: 100.5%;
    transition: scale ease-in-out 100ms;
  `}
  }
`

const CardBody = styled(CardBodyBase)`
  display: block !important;
  padding: 0;
`

const Img = styled.img`
  width: 100%;
  object-fit: cover;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
`

const CardFooter = styled(CardFooterBase)`
  background-color: ${(props) => props.theme.bodyBg};
  height: 5rem;
  padding: 0.5rem;
  overflow: hidden;
`

const PathogenName = styled.p<{ $color: string }>`
  font-size: 1.33rem !important;
  padding: 0;
  margin: 0;
  text-align: center;
  font-weight: bold;
  color: ${(props) => props.$color};
  text-shadow: ${(props) => props.theme.textOutline.light};
`

export function OverlayDisabled() {
  const { t } = useTranslationSafe()

  return (
    <OverlayWrapper>
      <OverlayBackground />
      <OverlayText>{t('Coming soon')}</OverlayText>
    </OverlayWrapper>
  )
}

const OverlayWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
`

const OverlayText = styled.p`
  font-size: 1.33rem;
  font-weight: bold;
  text-align: center;
  margin: auto;
  color: white;
  text-shadow: ${(props) => props.theme.textOutline.medium};
  z-index: 100;
`

const OverlayBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  opacity: 50%;
  border-radius: 5px;
`
