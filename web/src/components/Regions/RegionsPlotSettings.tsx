import React, { useMemo } from 'react'
import { Col, Row } from 'reactstrap'
import { Checkbox } from 'src/components/Common/Checkbox'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { useRecoilToggle } from 'src/hooks/useToggle'
import { shouldShowRangesOnRegionsPlotAtom } from 'src/state/settings.state'

export function RegionsPlotSettings() {
  const { t } = useTranslationSafe()
  const { state: shouldShowRanges, setState: setShouldShowRanges } = useRecoilToggle(shouldShowRangesOnRegionsPlotAtom)
  const title = useMemo(() => t('Show confidence ranges'), [t])
  return (
    <Row noGutters>
      <Col>
        <Checkbox title={title} checked={shouldShowRanges} setChecked={setShouldShowRanges}>
          {title}
        </Checkbox>
      </Col>
    </Row>
  )
}
