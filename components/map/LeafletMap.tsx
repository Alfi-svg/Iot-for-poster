'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Site } from '@/types';
import { formatStockWithCI } from '@/lib/utils/formatters';
import { Layers, Satellite, Mountain, Map as MapIcon, Eye, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface LeafletMapProps {
  sites: Site[];
  selectedSiteId: string | null;
  onSelectSite: (site: Site) => void;
}

type BasemapType = 'google_hybrid' | 'google_satellite' | 'google_terrain' | 'carto_vector';

// Satellite observation footprints covering Bangladesh study zones
const satelliteFootprints = [
  {
    id: 'SENTINEL-2_T45RXC',
    name: 'Sentinel-2 (Tile T45RXC)',
    region: 'Northwest - Barind & Tista Basin',
    bounds: [
      [24.1, 88.0],
      [25.9, 89.6],
    ] as L.LatLngBoundsLiteral,
    bands: 'B04 (Red), B08 (NIR) - 10m Ground Resolution',
    ecosystem: 'Agriculture (SOC)',
    cloudCover: '1.8%',
  },
  {
    id: 'SENTINEL-2_T45RYD',
    name: 'Sentinel-2 (Tile T45RYD)',
    region: 'North Central - Old Brahmaputra',
    bounds: [
      [23.9, 89.8],
      [25.2, 91.2],
    ] as L.LatLngBoundsLiteral,
    bands: 'B02, B03, B04, B08 - Surface Reflectance',
    ecosystem: 'Agriculture (Floodplain)',
    cloudCover: '2.4%',
  },
  {
    id: 'LANDSAT-9_LC09_137045',
    name: 'Landsat-9 OLI-2 (Path 137 / Row 045)',
    region: 'Southwest - Sundarbans Mangrove Core',
    bounds: [
      [21.6, 88.8],
      [23.1, 90.2],
    ] as L.LatLngBoundsLiteral,
    bands: 'SWIR1, SWIR2, Thermal TIRS - 30m Resolution',
    ecosystem: 'Blue Carbon (Mangroves)',
    cloudCover: '0.4%',
  },
  {
    id: 'SENTINEL-2_T46QCE',
    name: 'Sentinel-2 (Tile T46QCE)',
    region: 'Southeast - Cox\'s Bazar & Moheshkhali',
    bounds: [
      [20.7, 91.6],
      [22.2, 92.5],
    ] as L.LatLngBoundsLiteral,
    bands: 'Red Edge & Coastal Aerosol (B01, B05, B06)',
    ecosystem: 'Blue Carbon (Estuarine)',
    cloudCover: '3.1%',
  },
];

export default function LeafletMap({ sites, selectedSiteId, onSelectSite }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const footprintsLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeBasemap, setActiveBasemap] = useState<BasemapType>('google_hybrid');
  const [showFootprints, setShowFootprints] = useState<boolean>(true);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState<boolean>(false);

  // Basemap Tile URLs
  const basemapConfigs: Record<BasemapType, { url: string; attribution: string; subdomains?: string[] }> = {
    google_hybrid: {
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps Satellite Imagery & Cartography',
    },
    google_satellite: {
      url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Earth Satellite Imagery',
    },
    google_terrain: {
      url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps Physical Terrain',
    },
    carto_vector: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: ['a', 'b', 'c', 'd'],
    },
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Bangladesh
    const map = L.map(mapContainerRef.current, {
      center: [23.685, 90.3563],
      zoom: 7,
      minZoom: 6,
      maxZoom: 19,
      zoomControl: false,
    });

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial Base layer (Google Satellite Hybrid)
    const initialConfig = basemapConfigs.google_hybrid;
    const initialTileLayer = L.tileLayer(initialConfig.url, {
      attribution: initialConfig.attribution,
      maxZoom: 20,
    }).addTo(map);
    tileLayerRef.current = initialTileLayer;

    // Layer groups for footprints and markers
    const footprintsLayer = L.layerGroup().addTo(map);
    footprintsLayerRef.current = footprintsLayer;

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Basemap Switch
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = basemapConfigs[activeBasemap];
    const newTileLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 20,
      subdomains: config.subdomains || ['abc'],
    }).addTo(map);

    // Ensure tile layer sits at the very back
    newTileLayer.bringToBack();
    tileLayerRef.current = newTileLayer;
  }, [activeBasemap]);

  // Handle Satellite Footprint Polygons
  useEffect(() => {
    const map = mapInstanceRef.current;
    const footprintsLayer = footprintsLayerRef.current;
    if (!map || !footprintsLayer) return;

    footprintsLayer.clearLayers();

    if (!showFootprints) return;

    satelliteFootprints.forEach((fp) => {
      const isMangrove = fp.ecosystem.includes('Blue Carbon');
      const polygon = L.rectangle(fp.bounds, {
        color: isMangrove ? '#2DD4BF' : '#4ADE80',
        weight: 1.5,
        dashArray: '4, 4',
        fillColor: isMangrove ? '#0D9488' : '#16A34A',
        fillOpacity: 0.12,
      });

      const tooltipContent = `
        <div style="font-family: monospace; font-size: 11px; padding: 2px;">
          <div style="font-weight: 700; color: #ffffff; background: #0f172a; padding: 2px 6px; border-radius: 4px; margin-bottom: 3px;">
            🛰️ ${fp.name}
          </div>
          <div style="color: #cbd5e1; font-size: 10px;">${fp.region}</div>
          <div style="color: #94a3b8; font-size: 10px;">Bands: ${fp.bands}</div>
          <div style="color: #38bdf8; font-size: 10px;">Cloud Cover: ${fp.cloudCover}</div>
        </div>
      `;

      polygon.bindTooltip(tooltipContent, {
        sticky: true,
        className: 'satellite-footprint-tooltip',
      });

      footprintsLayer.addLayer(polygon);
    });
  }, [showFootprints]);

  // Update Markers when sites or selectedSiteId change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    sites.forEach((site) => {
      const isSelected = site.id === selectedSiteId;
      const isAgri = site.ecosystem === 'agriculture';

      const normalizedUncertainty = isAgri
        ? Math.min(Math.max((site.uncertaintyCI95 - 2.8) / 3.6, 0), 1)
        : Math.min(Math.max((site.uncertaintyCI95 - 14) / 18, 0), 1);

      const ringSizePx = 30 + Math.round(normalizedUncertainty * 20); // 30px to 50px
      const coreColor = isAgri ? '#22C55E' : '#14B8A6';
      const ringColor = isAgri
        ? normalizedUncertainty > 0.6 ? 'rgba(245, 158, 11, 0.45)' : 'rgba(34, 197, 94, 0.35)'
        : normalizedUncertainty > 0.6 ? 'rgba(245, 158, 11, 0.45)' : 'rgba(20, 184, 166, 0.35)';

      const markerHtml = `
        <div style="position: relative; width: ${ringSizePx}px; height: ${ringSizePx}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <!-- Outer Uncertainty Ring -->
          <div style="position: absolute; inset: 0; border-radius: 9999px; background: ${ringColor}; border: ${
        normalizedUncertainty > 0.6 ? '1.5px dashed #F59E0B' : '1.5px solid ' + coreColor
      }; ${isSelected ? 'transform: scale(1.3); box-shadow: 0 0 14px rgba(255, 255, 255, 0.9);' : 'box-shadow: 0 0 8px rgba(0,0,0,0.4);'} transition: all 0.2s ease;"></div>
          
          <!-- Inner Core Dot -->
          <div style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background: ${coreColor}; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.6);"></div>
          
          <!-- Quality Flag indicator dot if flagged -->
          ${
            site.qualityFlagsCount > 0
              ? `<div style="position: absolute; top: 0; right: 0; width: 10px; height: 10px; border-radius: 9999px; background: #EF4444; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.5);"></div>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-mrv-marker',
        html: markerHtml,
        iconSize: [ringSizePx, ringSizePx],
        iconAnchor: [ringSizePx / 2, ringSizePx / 2],
      });

      const marker = L.marker([site.coordinates.lat, site.coordinates.lng], {
        icon: customIcon,
        title: site.name,
      });

      // Accessible popup tooltip
      const tooltipContent = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.35; padding: 3px; min-width: 170px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${site.name}</div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">
            ${site.upazila}, ${site.district} (${isAgri ? 'Agriculture' : 'Blue Carbon'})
          </div>
          <div style="font-family: monospace; font-weight: 700; color: ${isAgri ? '#16A34A' : '#0D9488'}; font-size: 13px;">
            ${formatStockWithCI(site.estimatedStock, site.uncertaintyCI95)}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 3px; border-top: 1px solid #f1f5f9; padding-top: 3px;">
            Satellite Proxy: Sentinel-2 NDVI (${(site.recentTelemetry[0]?.ndvi || 0.62).toFixed(2)})
            ${site.qualityFlagsCount > 0 ? `<br><span style="color: #DC2626; font-weight: 600;">⚠ ${site.qualityFlagsCount} QC Drift Flag(s)</span>` : ''}
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -ringSizePx / 2],
        opacity: 0.98,
      });

      marker.on('click', () => {
        onSelectSite(site);
      });

      markersLayer.addLayer(marker);
    });
  }, [sites, selectedSiteId, onSelectSite]);

  return (
    <div className="w-full h-full relative z-0">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Satellite Layer Switcher (Top Left) */}
      <div className="absolute top-4 right-14 z-20 flex flex-col items-end gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl shadow-xl border border-slate-700/80 flex items-center gap-1 text-xs">
          {(
            [
              { id: 'google_hybrid', label: 'Google Satellite (Hybrid)', icon: Satellite },
              { id: 'google_satellite', label: 'Satellite (Raw)', icon: Eye },
              { id: 'google_terrain', label: 'Google Terrain', icon: Mountain },
              { id: 'carto_vector', label: 'Street Map', icon: MapIcon },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isActive = activeBasemap === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveBasemap(item.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                )}
                title={item.label}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Satellite Footprints Overlay Toggle */}
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg border border-slate-700/80 flex items-center gap-2 text-xs text-slate-200">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showFootprints}
              onChange={(e) => setShowFootprints(e.target.checked)}
              className="accent-emerald-500 w-3.5 h-3.5 cursor-pointer rounded"
            />
            <span className="font-mono text-[11px] flex items-center gap-1.5">
              <span>🛰️ Sentinel/Landsat Tile Grid</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            </span>
          </label>
        </div>
      </div>

      {/* Floating Satellite Telemetry Data Badge (Bottom Center) */}
      <div className="absolute bottom-4 right-4 z-10 bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-xl border border-slate-800 text-xs text-slate-300 hidden md:flex items-center gap-3 font-mono">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <Satellite className="w-4 h-4 text-emerald-400" />
          <span>Google Earth Satellite Feed Active</span>
        </div>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400 text-[11px]">
          Observation: <strong>Sentinel-2 (10m)</strong> & <strong>Landsat-9 (30m)</strong>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400 text-[11px]">
          Sensor: <strong>Surface Reflectance (NDVI Proxy)</strong>
        </span>
      </div>
    </div>
  );
}
