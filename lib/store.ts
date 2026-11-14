import { create } from 'zustand';
import { EcosystemFilter } from '@/types';

interface DashboardState {
  ecosystemFilter: EcosystemFilter;
  setEcosystemFilter: (filter: EcosystemFilter) => void;
  selectedSiteId: string | null;
  setSelectedSiteId: (id: string | null) => void;
  isSiteDrawerOpen: boolean;
  setSiteDrawerOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  ecosystemFilter: 'all',
  setEcosystemFilter: (filter) => set({ ecosystemFilter: filter }),
  selectedSiteId: null,
  setSelectedSiteId: (id) => set({ selectedSiteId: id, isSiteDrawerOpen: id !== null }),
  isSiteDrawerOpen: false,
  setSiteDrawerOpen: (open) => set({ isSiteDrawerOpen: open }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
