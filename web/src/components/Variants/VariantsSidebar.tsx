import React, { useMemo } from 'react'
import { useRecoilState_TRANSITION_SUPPORT_UNSTABLE as useRecoilState } from 'recoil'
import { SearchBox } from 'src/components/Common/SearchBox'
import { isSidebarSettingsCollapsedAtom } from 'src/state/settings.state'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { SidebarSectionGeography } from 'src/components/Sidebar/SidebarSectionGeography'
import { Sidebar, SidebarSection, SidebarSectionCollapsible } from 'src/components/Sidebar/SidebarCard'
import { geographySearchTermAtom } from 'src/state/geography.state'
import { VariantsPlotSettings } from './VariantsPlotSettings'

export function VariantsSidebar() {
  const { t } = useTranslationSafe()
  const geographyHeader = useMemo(() => <GeographySectionHeader />, [])
  return (
    <Sidebar>
      <SidebarSection header={geographyHeader}>
        <SidebarSectionGeography />
      </SidebarSection>
      <SidebarSectionCollapsible header={t('Settings')} recoilState={isSidebarSettingsCollapsedAtom}>
        <VariantsPlotSettings />
      </SidebarSectionCollapsible>
    </Sidebar>
  )
}

function GeographySectionHeader() {
  const [searchTerm, setSearchTerm] = useRecoilState(geographySearchTermAtom)
  return <SearchBox searchTitle={'Search locations'} searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
}
