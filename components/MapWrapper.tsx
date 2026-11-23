'use client';

import { useEffect, useRef } from 'react';
import type * as LeafletNamespace from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Spot } from '../types';
import { getGoogleMapsUrl } from '../lib/googleMaps';

export interface LatLngPoint {
  lat: number;
  lng: number;
}

interface MapWrapperProps {
  spots?: Spot[];
  userLocation?: LatLngPoint | null;
}

function toNum(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export default function MapWrapper({
  spots = [],
  userLocation = null,
}: MapWrapperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletNamespace.Map | null>(null);
  const spotsLayerRef = useRef<LeafletNamespace.LayerGroup | null>(null);
  const userLayerRef = useRef<LeafletNamespace.LayerGroup | null>(null);
  const leafletRef = useRef<typeof LeafletNamespace | null>(null);
  const hasFittedInitialBoundsRef = useRef(false);

  const renderSpots = (
    L: typeof LeafletNamespace,
    map: LeafletNamespace.Map,
    layerGroup: LeafletNamespace.LayerGroup
  ) => {
    layerGroup.clearLayers();
    const bounds: [number, number][] = [];

    spots.forEach((spot) => {
      const lat = toNum(spot.latitude);
      const lng = toNum(spot.longitude);
      if (lat === null || lng === null) return;

      bounds.push([lat, lng]);

      const mapsUrl = getGoogleMapsUrl(spot);
      const popupHtml = `
        <div style="min-width:160px;line-height:1.45;">
          <div style="font-weight:700;font-size:13px;margin-bottom:2px;">${spot.name ?? ''}</div>
          ${spot.category ? `<div style="font-size:11px;color:#047857;margin-bottom:4px;">${spot.category}</div>` : ''}
          ${spot.address ? `<div style="font-size:11px;color:#475569;margin-bottom:6px;">${spot.address}</div>` : ''}
          <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#0f766e;text-decoration:underline;">Googleマップで開く</a>
        </div>
      `;

      L.marker([lat, lng]).bindPopup(popupHtml).addTo(layerGroup);
    });

    if (!hasFittedInitialBoundsRef.current) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 15);
        hasFittedInitialBoundsRef.current = true;
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [32, 32] });
        hasFittedInitialBoundsRef.current = true;
      }
    }

    map.invalidateSize();
  };

  const renderUserLocation = (
    L: typeof LeafletNamespace,
    map: LeafletNamespace.Map,
    layerGroup: LeafletNamespace.LayerGroup
  ) => {
    layerGroup.clearLayers();

    const lat = toNum(userLocation?.lat);
    const lng = toNum(userLocation?.lng);
    if (lat === null || lng === null) return;

    // 外側の淡い円＋中心の現在地マーカー
    L.circle([lat, lng], {
      radius: 80,
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      weight: 1.5,
    }).addTo(layerGroup);

    const currentIcon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 0 0 2px rgba(37,99,235,0.45);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    L.marker([lat, lng], { icon: currentIcon, zIndexOffset: 1000 })
      .bindPopup('<div style="font-weight:700;font-size:12px;">現在地</div>')
      .addTo(layerGroup);

    map.invalidateSize();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    let cancelled = false;
    let observer: ResizeObserver | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      const mod = await import('leaflet');
      const L = (mod.default ?? mod) as typeof LeafletNamespace;
      if (cancelled || !containerRef.current || mapRef.current) return;

      leafletRef.current = L;

      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
        ._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const initialLat = toNum(userLocation?.lat) ?? 34.6937;
      const initialLng = toNum(userLocation?.lng) ?? 135.5022;

      const map = L.map(containerRef.current).setView(
        [initialLat, initialLng],
        13
      );

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const spotsLayer = L.layerGroup().addTo(map);
      const userLayer = L.layerGroup().addTo(map);

      mapRef.current = map;
      spotsLayerRef.current = spotsLayer;
      userLayerRef.current = userLayer;

      observer = new ResizeObserver(() => {
        map.invalidateSize();
      });
      observer.observe(containerRef.current);

      timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);

      renderSpots(L, map, spotsLayer);
      renderUserLocation(L, map, userLayer);
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (observer) observer.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      spotsLayerRef.current = null;
      userLayerRef.current = null;
      hasFittedInitialBoundsRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const spotsLayer = spotsLayerRef.current;
    if (!L || !map || !spotsLayer) return;

    renderSpots(L, map, spotsLayer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const userLayer = userLayerRef.current;
    if (!L || !map || !userLayer) return;

    renderUserLocation(L, map, userLayer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  return <div ref={containerRef} className="w-full h-full min-h-[360px]" />;
}