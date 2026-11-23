// lib/googleMaps.ts
export type MapSpotTarget = {
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function getGoogleMapsUrl(spot: MapSpotTarget): string {
  // 緯度・経度があればピン位置で開く
  if (spot.latitude != null && spot.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}`;
  }

  // 座標がない場合は施設名＋住所で検索して開く
  const query = [spot.name, spot.address].filter(Boolean).join(' ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}