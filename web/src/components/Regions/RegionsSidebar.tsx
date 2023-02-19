import React from 'react'
import { isSidebarSettingsCollapsedAtom } from 'src/state/settings.state'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { SidebarSectionVariants } from 'src/components/Sidebar/SidebarSectionVariants'
import { Sidebar, SidebarSection, SidebarSectionCollapsible } from 'src/components/Sidebar/SidebarCard'
import { RegionsPlotSettings } from './RegionsPlotSettings'

export function RegionsSidebar() {
  const { t } = useTranslationSafe()
  return (
    <Sidebar>
      <SidebarSection header={t('Variants')}>
        <SidebarSectionVariants />
      </SidebarSection>
      <SidebarSectionCollapsible header={t('Settings')} recoilState={isSidebarSettingsCollapsedAtom}>
        <RegionsPlotSettings />
      </SidebarSectionCollapsible>
    </Sidebar>
  )
}
