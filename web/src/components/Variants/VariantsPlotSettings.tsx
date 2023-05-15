import React, { useMemo } from 'react'
import styled from 'styled-components'
import { Form as FormBase } from 'reactstrap'
import { CheckboxWithText } from 'src/components/Common/Checkbox'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { useRecoilToggle } from 'src/hooks/useToggle'
import { shouldShowDotsOnVariantsPlotAtom, shouldShowRangesOnVariantsPlotAtom } from 'src/state/settings.state'

export function VariantsPlotSettings() {
  const { t } = useTranslationSafe()
  const { state: shouldShowRanges, setState: setShouldShowRanges } = useRecoilToggle(shouldShowRangesOnVariantsPlotAtom)
  const { state: shouldShowDots, setState: setShouldShowDots } = useRecoilToggle(shouldShowDotsOnVariantsPlotAtom)
  const text = useMemo(() => t('Show confidence intervals'), [t])
  const text2 = useMemo(() => t('Show observed counts'), [t])
  return (
    <Form>
      <CheckboxWithText title={text} label={text} checked={shouldShowRanges} setChecked={setShouldShowRanges} />
      <CheckboxWithText title={text2} label={text2} checked={shouldShowDots} setChecked={setShouldShowDots} />
    </Form>
  )
}

const Form = styled(FormBase)`
  overflow-x: hidden;
`
