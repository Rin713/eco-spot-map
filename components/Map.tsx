'use client';

import { Spot } from '../types';

interface MapProps {
  spots: Spot[];
}

function toNum(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export default function Map({ spots }: MapProps) {
  let lat = 34.6937;
  let lng = 135.5022;

  for (const spot of spots ?? []) {
    const sLat = toNum(spot.latitude);
    const sLng = toNum(spot.longitude);
    if (sLat !== null && sLng !== null) {
      lat = sLat;
      lng = sLng;
      break;
    }
  }

  const deltaLat = 0.015;
  const deltaLng = 0.02;
  const bbox = `${lng - deltaLng},${lat - deltaLat},${lng + deltaLng},${lat + deltaLat}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox
  )}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '360px' }}>
      <div
        style={{
          background: '#fee2e2',
          color: '#991b1b',
          padding: '6px 10px',
          fontWeight: 'bold',
          fontSize: '13px',
        }}
      >
        Map.tsx 描画中（spots: {spots?.length ?? 0}）
      </div>
      <iframe
        title="エコスポット地図"
        src={src}
        style={{ width: '100%', height: '320px', border: 0 }}
      />
    </div>
  );
}