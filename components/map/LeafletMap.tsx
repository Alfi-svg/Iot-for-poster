'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Site } from '@/types';
import { formatStockWithCI } from '@/lib/utils/formatters';

interface LeafletMapProps {
  sites: Site[];
  selectedSiteId: string | null;
  onSelectSite: (site: Site) => void;
}

export default function LeafletMap({ sites, selectedSiteId, onSelectSite }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Bangladesh
    const map = L.map(mapContainerRef.current, {
      center: [23.685, 90.3563],
      zoom: 7,
      minZoom: 6,
      maxZoom: 16,
      zoomControl: false,
    });

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap clean carto tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when sites or selectedSiteId change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    sites.forEach((site) => {
      const isSelected = site.id === selectedSiteId;
      const isAgri = site.ecosystem === 'agriculture';

      // Uncertainty ring sizing: proportional to CI width
      // Agriculture CI typically 2.8-6.4; Blue Carbon CI typically 14-32
      const normalizedUncertainty = isAgri
        ? Math.min(Math.max((site.uncertaintyCI95 - 2.8) / 3.6, 0), 1)
        : Math.min(Math.max((site.uncertaintyCI95 - 14) / 18, 0), 1);

      const ringSizePx = 28 + Math.round(normalizedUncertainty * 20); // 28px to 48px
      const coreColor = isAgri ? '#15803D' : '#0F766E';
      const ringColor = isAgri
        ? normalizedUncertainty > 0.6 ? 'rgba(217, 119, 6, 0.4)' : 'rgba(21, 128, 61, 0.25)'
        : normalizedUncertainty > 0.6 ? 'rgba(217, 119, 6, 0.4)' : 'rgba(15, 118, 110, 0.25)';

      const markerHtml = `
        <div style="position: relative; width: ${ringSizePx}px; height: ${ringSizePx}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <!-- Outer Uncertainty Ring -->
          <div style="position: absolute; inset: 0; border-radius: 9999px; background: ${ringColor}; border: ${
        normalizedUncertainty > 0.6 ? '1.5px dashed #D97706' : '1px solid ' + coreColor
      }; ${isSelected ? 'transform: scale(1.25); box-shadow: 0 0 0 3px #14532D;' : ''} transition: all 0.2s ease;"></div>
          
          <!-- Inner Core Dot -->
          <div style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background: ${coreColor}; border: 2.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.25);"></div>
          
          <!-- Quality Flag indicator dot if flagged -->
          ${
            site.qualityFlagsCount > 0
              ? `<div style="position: absolute; top: 0; right: 0; width: 9px; height: 9px; border-radius: 9999px; background: #DC2626; border: 1.5px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.3);"></div>`
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

      // Accessible interactive popup tooltip
      const tooltipContent = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.35; padding: 2px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${site.name}</div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">
            ${site.upazila}, ${site.district} (${isAgri ? 'Agriculture' : 'Blue Carbon'})
          </div>
          <div style="font-family: monospace; font-weight: 700; color: ${coreColor}; font-size: 13px;">
            ${formatStockWithCI(site.estimatedStock, site.uncertaintyCI95)}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 3px;">
            Uncertainty: ±${site.uncertaintyCI95} t C/ha (${site.uncertaintyPercent}%)
            ${site.qualityFlagsCount > 0 ? `<br><span style="color: #DC2626; font-weight: 600;">⚠ ${site.qualityFlagsCount} QC Flag(s)</span>` : ''}
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -ringSizePx / 2],
        opacity: 0.95,
      });

      marker.on('click', () => {
        onSelectSite(site);
      });

      markersLayer.addLayer(marker);
    });
  }, [sites, selectedSiteId, onSelectSite]);

  return <div ref={mapContainerRef} className="w-full h-full relative z-0" />;
}
