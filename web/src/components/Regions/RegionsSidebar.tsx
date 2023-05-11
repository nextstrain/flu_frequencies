import React, { useMemo } from 'react'
import { useRecoilState_TRANSITION_SUPPORT_UNSTABLE as useRecoilState } from 'recoil'
import { SearchBox } from 'src/components/Common/SearchBox'
import { variantsSearchTermAtom } from 'src/state/geography.state'
import { isSidebarSettingsCollapsedAtom } from 'src/state/settings.state'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { SidebarSectionVariants } from 'src/components/Sidebar/SidebarSectionVariants'
import { Sidebar, SidebarSection, SidebarSectionCollapsible } from 'src/components/Sidebar/SidebarCard'
import { RegionsPlotSettings } from './RegionsPlotSettings'

export interface RegionsSidebarProps {
  pathogenName: string
}

export function RegionsSidebar({ pathogenName }: RegionsSidebarProps) {
  const { t } = useTranslationSafe()
  const variantsHeader = useMemo(() => <VariantsSectionHeader />, [])
  return (
    <Sidebar>
      <SidebarSection header={variantsHeader}>
        <SidebarSectionVariants pathogenName={pathogenName} />
      </SidebarSection>
      <SidebarSectionCollapsible header={t('Settings')} recoilState={isSidebarSettingsCollapsedAtom}>
        <RegionsPlotSettings />
      </SidebarSectionCollapsible>
    </Sidebar>
  )
}

function VariantsSectionHeader() {
  const [searchTerm, setSearchTerm] = useRecoilState(variantsSearchTermAtom)
  return <SearchBox searchTitle={'Search variants'} searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
}
