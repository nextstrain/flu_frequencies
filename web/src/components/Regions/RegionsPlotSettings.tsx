import React, { useMemo } from 'react'
import { CheckboxWithText } from 'src/components/Common/Checkbox'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { useRecoilToggle } from 'src/hooks/useToggle'
import { shouldShowDotsOnRegionsPlotAtom, shouldShowRangesOnRegionsPlotAtom } from 'src/state/settings.state'

export function RegionsPlotSettings() {
  const { t } = useTranslationSafe()
  const { state: shouldShowRanges, setState: setShouldShowRanges } = useRecoilToggle(shouldShowRangesOnRegionsPlotAtom)
  const { state: shouldShowDots, setState: setShouldShowDots } = useRecoilToggle(shouldShowDotsOnRegionsPlotAtom)
  const text = useMemo(() => t('Show confidence intervals'), [t])
  const text2 = useMemo(() => t('Show observed counts'), [t])
  return (
    <>
      <CheckboxWithText title={text} label={text} checked={shouldShowRanges} setChecked={setShouldShowRanges} />
      <CheckboxWithText title={text2} label={text2} checked={shouldShowDots} setChecked={setShouldShowDots} />
    </>
  )
}
