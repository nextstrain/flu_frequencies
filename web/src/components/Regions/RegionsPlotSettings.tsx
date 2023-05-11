import React, { useMemo } from 'react'
import { CheckboxWithText } from 'src/components/Common/Checkbox'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { useRecoilToggle } from 'src/hooks/useToggle'
import { shouldShowRangesOnRegionsPlotAtom } from 'src/state/settings.state'

export function RegionsPlotSettings() {
  const { t } = useTranslationSafe()
  const { state: shouldShowRanges, setState: setShouldShowRanges } = useRecoilToggle(shouldShowRangesOnRegionsPlotAtom)
  const text = useMemo(() => t('Show confidence intervals'), [t])
  return <CheckboxWithText title={text} label={text} checked={shouldShowRanges} setChecked={setShouldShowRanges} />
}
