import React, { useMemo } from 'react'
import styled from 'styled-components'
import { isSidebarSettingsCollapsedAtom } from 'src/state/settings.state'
import { useTranslationSafe } from 'src/helpers/useTranslationSafe'
import { SidebarSectionVariants } from 'src/components/Sidebar/SidebarSectionVariants'
import { Sidebar, SidebarSection, SidebarSectionCollapsible } from 'src/components/Sidebar/SidebarCard'
import { SidebarSectionGeography } from 'src/components/Sidebar/SidebarSectionGeography'
import { RegionsPlotSettings } from 'src/components/Regions/RegionsPlotSettings'
import { GeographySectionHeader } from 'src/components/Variants/VariantsSidebar'
import { VariantsSectionHeader } from 'src/components/Regions/RegionsSidebar'
import { useVariantsDataQuery } from 'src/io/getData'

export interface RegionsSidebarProps {
  pathogenName: string
}

export function VariantsAndRegionsSidebar({ pathogenName }: RegionsSidebarProps) {
  const { t } = useTranslationSafe()

  const { variants } = useVariantsDataQuery(pathogenName)

  const variantsHeader = useMemo(
    () => (
      <Wrapper>
        <VariantsSectionHeader />
      </Wrapper>
    ),
    [],
  )
  const geographyHeader = useMemo(() => <GeographySectionHeader />, [])

  return (
    <Sidebar>
      <SidebarSection header={variantsHeader}>
        <SidebarSectionVariants pathogenName={pathogenName} variants={variants} />
      </SidebarSection>
      <SidebarSection header={geographyHeader}>
        <SidebarSectionGeography pathogenName={pathogenName} />
      </SidebarSection>
      <SidebarSectionCollapsible header={t('Settings')} recoilState={isSidebarSettingsCollapsedAtom}>
        <RegionsPlotSettings />
      </SidebarSectionCollapsible>
    </Sidebar>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`
