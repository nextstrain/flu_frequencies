import React, { useMemo } from 'react'
import { Form } from 'reactstrap'
import { CheckboxWithText } from 'src/components/Common/Checkbox'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { useRecoilToggle } from 'src/hooks/useToggle'
import {
  shouldShowBubblesOnRegionsPlotAtom,
  shouldShowConfidenceBarsOnRegionsPlotAtom,
  shouldShowRangesOnRegionsPlotAtom,
} from 'src/state/settings.state'

export function RegionsPlotSettings() {
  const { t } = useTranslationSafe()
  const { state: shouldShowRanges, setState: setShouldShowRanges } = useRecoilToggle(shouldShowRangesOnRegionsPlotAtom)
  const { state: shouldShowConfidenceBars, setState: setShouldShowConfidenceBars } = useRecoilToggle(
    shouldShowConfidenceBarsOnRegionsPlotAtom,
  )
  const { state: shouldShowBubbles, setState: setShouldShowBubbles } = useRecoilToggle(
    shouldShowBubblesOnRegionsPlotAtom,
  )
  const textBubbles = useMemo(() => t('Show bubbles'), [t])
  const textRanges = useMemo(() => t('Show confidence intervals'), [t])
  const textBars = useMemo(() => t('Show confidence bars on hover'), [t])
  return (
    <Form>
      <CheckboxWithText
        title={textBubbles}
        label={textBubbles}
        checked={shouldShowBubbles}
        setChecked={setShouldShowBubbles}
      />
      <CheckboxWithText
        title={textRanges}
        label={textRanges}
        checked={shouldShowRanges}
        setChecked={setShouldShowRanges}
      />
      <CheckboxWithText
        title={textBars}
        label={textBars}
        checked={shouldShowConfidenceBars}
        setChecked={setShouldShowConfidenceBars}
      />
    </Form>
  )
}
