'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { repository } from '@/lib/repository';
import { useDashboardStore } from '@/lib/store';
import { Site, EcosystemFilter } from '@/types';
import { MapWrapper } from '@/components/map/MapWrapper';
import { MapFilterPanel } from '@/components/map/MapFilterPanel';
import { SiteDetailDrawer } from '@/components/site/SiteDetailDrawer';
import { formatStockWithCI } from '@/lib/utils/formatters';
import { EcosystemBadge } from '@/components/ui/Badge';
import { MapPin, AlertTriangle, Layers, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function MapPage() {
  const { ecosystemFilter, setEcosystemFilter } = useDashboardStore();
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Local filter states
  const [uncertaintyFilter, setUncertaintyFilter] = useState<'all' | 'low' | 'moderate' | 'high'>('all');
  const [qualityFilter, setQualityFilter] = useState<'all' | 'clean' | 'flagged'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    async function fetchSites() {
      setLoading(true);
      const sites = await repository.getSites();
      setAllSites(sites);
      setLoading(false);
    }
    fetchSites();
  }, []);

  // Filtered sites
  const filteredSites = useMemo(() => {
    return allSites.filter((site) => {
      // Ecosystem filter
      if (ecosystemFilter !== 'all' && site.ecosystem !== ecosystemFilter) return false;

      // Uncertainty filter
      if (uncertaintyFilter === 'low' && site.uncertaintyCI95 >= 5) return false;
      if (uncertaintyFilter === 'moderate' && (site.uncertaintyCI95 < 5 || site.uncertaintyCI95 > 15)) return false;
      if (uncertaintyFilter === 'high' && site.uncertaintyCI95 <= 15) return false;

      // Quality flag filter
      if (qualityFilter === 'clean' && site.qualityFlagsCount > 0) return false;
      if (qualityFilter === 'flagged' && site.qualityFlagsCount === 0) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = site.name.toLowerCase().includes(q);
        const matchesDistrict = site.district.toLowerCase().includes(q);
        const matchesId = site.id.toLowerCase().includes(q);
        const matchesLand = site.landType.toLowerCase().includes(q);
        if (!matchesName && !matchesDistrict && !matchesId && !matchesLand) return false;
      }

      return true;
    });
  }, [allSites, ecosystemFilter, uncertaintyFilter, qualityFilter, searchQuery]);

  const handleSelectSite = (site: Site) => {
    setSelectedSite(site);
    setIsDrawerOpen(true);
  };

  const handleResetFilters = () => {
    setEcosystemFilter('all');
    setUncertaintyFilter('all');
    setQualityFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="relative h-[calc(100vh-6.5rem)] -mx-4 lg:-mx-8 -my-6 flex overflow-hidden">
      {/* Mobile Filter Toggle Button */}
      <div className="absolute top-4 left-4 z-20 lg:hidden">
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 text-xs font-semibold text-slate-800"
        >
          <SlidersHorizontal className="w-4 h-4 text-emerald-800" />
          Filter Sites ({filteredSites.length})
        </button>
      </div>

      {/* Desktop Left Side Filter & Site List Panel */}
      <div className="hidden lg:flex flex-col w-96 border-r border-slate-200 bg-white z-10 overflow-hidden shadow-subtle">
        {/* Filter Controls Top */}
        <div className="p-4 border-b border-slate-100 flex-shrink-0">
          <MapFilterPanel
            ecosystem={ecosystemFilter}
            setEcosystem={setEcosystemFilter}
            uncertaintyFilter={uncertaintyFilter}
            setUncertaintyFilter={setUncertaintyFilter}
            qualityFilter={qualityFilter}
            setQualityFilter={setQualityFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            matchingCount={filteredSites.length}
            totalCount={allSites.length}
            onReset={handleResetFilters}
          />
        </div>

        {/* Filtered Sites Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
          {filteredSites.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No sites match your spatial filter criteria.
            </div>
          ) : (
            filteredSites.map((site) => {
              const isSelected = selectedSite?.id === site.id;
              const isAgri = site.ecosystem === 'agriculture';

              return (
                <div
                  key={site.id}
                  onClick={() => handleSelectSite(site)}
                  className={cn(
                    'p-3 rounded-xl cursor-pointer transition-all text-xs space-y-1 border',
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                      : 'border-transparent hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {site.id}
                    </span>
                    <EcosystemBadge ecosystem={site.ecosystem} />
                  </div>

                  <div className="font-semibold text-slate-900 leading-snug truncate">
                    {site.name}
                  </div>

                  <div className="text-[11px] text-slate-500">
                    {site.upazila}, {site.district}
                  </div>

                  <div className="pt-1 flex items-center justify-between font-mono">
                    <span
                      className={`font-bold ${
                        isAgri ? 'text-emerald-800' : 'text-teal-800'
                      }`}
                    >
                      {formatStockWithCI(site.estimatedStock, site.uncertaintyCI95)}
                    </span>
                    {site.qualityFlagsCount > 0 ? (
                      <span className="text-amber-600 font-sans font-semibold text-[10px] flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> Flagged
                      </span>
                    ) : (
                      <span className="text-slate-400 font-sans text-[10px]">QC OK</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Mobile Drawer Filter Sheet */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl p-4 overflow-y-auto z-10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Filter Sites</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <MapFilterPanel
              ecosystem={ecosystemFilter}
              setEcosystem={setEcosystemFilter}
              uncertaintyFilter={uncertaintyFilter}
              setUncertaintyFilter={setUncertaintyFilter}
              qualityFilter={qualityFilter}
              setQualityFilter={setQualityFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              matchingCount={filteredSites.length}
              totalCount={allSites.length}
              onReset={handleResetFilters}
            />
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full py-2 bg-emerald-800 text-white rounded-lg text-xs font-semibold"
            >
              Apply & View {filteredSites.length} Sites
            </button>
          </div>
        </div>
      )}

      {/* Map Canvas */}
      <div className="flex-1 h-full relative">
        <MapWrapper
          sites={filteredSites}
          selectedSiteId={selectedSite?.id || null}
          onSelectSite={handleSelectSite}
        />

        {/* Floating Quick Status Overlay */}
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-lg shadow-xl border border-slate-700 text-xs font-mono hidden sm:flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Sites: {filteredSites.length}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">🛰️ Google Satellite Layer</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">EPSG:4326 (WGS84)</span>
        </div>
      </div>

      {/* Slide-out Site Detail Drawer */}
      <SiteDetailDrawer
        site={selectedSite}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
