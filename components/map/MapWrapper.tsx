'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Site } from '@/types';
import { Satellite, Loader2 } from 'lucide-react';

const DynamicLeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-300 rounded-xl space-y-2">
      <div className="relative">
        <Satellite className="w-8 h-8 text-emerald-400 animate-pulse" />
        <Loader2 className="w-4 h-4 text-white animate-spin absolute -bottom-1 -right-1" />
      </div>
      <p className="text-sm font-semibold text-white">Initializing Satellite Earth Observation Map...</p>
      <p className="text-xs text-slate-400 font-mono">Streaming Google Satellite imagery & Sentinel-2/Landsat study grids</p>
    </div>
  ),
});

interface MapWrapperProps {
  sites: Site[];
  selectedSiteId: string | null;
  onSelectSite: (site: Site) => void;
}

export function MapWrapper(props: MapWrapperProps) {
  return <DynamicLeafletMap {...props} />;
}
