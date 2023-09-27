import React, { useMemo } from 'react'
import styled from 'styled-components'
import { useRecoilState_TRANSITION_SUPPORT_UNSTABLE as useRecoilState } from 'recoil'
import { SearchBox } from 'src/components/Common/SearchBox'
import { variantsSearchTermAtom } from 'src/state/geography.state'
import { isSidebarSettingsCollapsedAtom } from 'src/state/settings.state'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { SidebarSectionVariants } from 'src/components/Sidebar/SidebarSectionVariants'
import { Sidebar, SidebarSection, SidebarSectionCollapsible } from 'src/components/Sidebar/SidebarCard'
import { RegionsPlotSettings } from './RegionsPlotSettings'
import { SortingCriteriaSelector } from '../Sidebar/SidebarSortVariants'

export interface RegionsSidebarProps {
  pathogenName: string
  region: string
}

export function RegionsSidebar({ pathogenName, region }: RegionsSidebarProps) {
  const { t } = useTranslationSafe()
  const variantsHeader = useMemo(
    () => (
      <Wrapper>
        <VariantsSectionHeader />
        <SortingCriteriaSelector />
      </Wrapper>
    ),
    [],
  )
  return (
    <Sidebar>
      <SidebarSection header={variantsHeader}>
        <SidebarSectionVariants pathogenName={pathogenName} region={region} />
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

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`
