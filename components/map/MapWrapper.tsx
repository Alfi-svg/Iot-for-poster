'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Site } from '@/types';
import { Loader2 } from 'lucide-react';

const DynamicLeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500 rounded-xl">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
      <p className="text-sm font-medium">Initializing Spatial Bangladesh Map...</p>
      <p className="text-xs text-slate-400">Loading OpenStreetMap vector tiles & site telemetry</p>
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
