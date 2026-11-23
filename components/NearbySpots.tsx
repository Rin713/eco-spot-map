'use client';

import { useState } from 'react';
import { Spot } from '../types';
import { getDistanceInKm } from '../lib/distance';
import { getGoogleMapsUrl } from '../lib/googleMaps';

interface NearbySpotsProps {
  spots: Spot[];
  onLocationFound?: (location: { lat: number; lng: number }) => void;
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `約${Math.round(distanceKm * 1000)}m`;
  }
  return `約${distanceKm.toFixed(1)}km`;
}

export default function NearbySpots({ spots, onLocationFound }: NearbySpotsProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(1.0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('お使いのブラウザは位置情報に対応していません。');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setLoading(false);
        onLocationFound?.(location);
      },
      (error) => {
        console.error('位置情報取得エラー:', error);
        setErrorMsg('位置情報の取得に失敗しました。位置情報の利用を許可してください。');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const nearbySpots = userLocation
    ? spots
        .filter(
          (spot) =>
            typeof spot.latitude === 'number' && typeof spot.longitude === 'number'
        )
        .map((spot) => {
          const distance = getDistanceInKm(
            userLocation.lat,
            userLocation.lng,
            spot.latitude,
            spot.longitude
          );
          return { ...spot, distance };
        })
        .filter((spot) => spot.distance <= maxDistanceKm)
        .sort((a, b) => a.distance - b.distance)
    : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-slate-800 text-sm">
          📍 近くのスポット検索
        </h2>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={loading}
          className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {loading ? '取得中...' : userLocation ? '現在地を更新' : '現在地を取得'}
        </button>
      </div>

      {/* 検索範囲の切り替え */}
      <div className="flex items-center gap-1.5 mb-3">
        {[
          { label: '500m', value: 0.5 },
          { label: '1km', value: 1.0 },
          { label: '3km', value: 3.0 },
        ].map((range) => (
          <button
            key={range.value}
            type="button"
            onClick={() => setMaxDistanceKm(range.value)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition ${
              maxDistanceKm === range.value
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {range.label}以内
          </button>
        ))}
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500 mb-3">{errorMsg}</p>
      )}

      {!userLocation && !loading && (
        <p className="text-xs text-slate-400">
          「現在地を取得」ボタンを押すと、指定した範囲内のスポットを近い順に表示します。
        </p>
      )}

      {userLocation && (
        <div>
          <p className="text-xs text-slate-500 mb-3">
            現在地から {maxDistanceKm < 1 ? `${maxDistanceKm * 1000}m` : `${maxDistanceKm}km`} 以内に{' '}
            <span className="font-bold text-emerald-600">{nearbySpots.length} 件</span> 見つかりました。
          </p>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {nearbySpots.length === 0 ? (
              <p className="text-xs text-slate-400">
                この範囲内に登録スポットはありません。
              </p>
            ) : (
              nearbySpots.map((spot, index) => (
                <a
                  key={spot.id || `nearby-${index}`}
                  href={getGoogleMapsUrl(spot)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100 hover:bg-emerald-100/60 hover:border-emerald-200 transition flex items-center justify-between gap-2 block"
                >
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-slate-800 truncate">
                      {spot.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 truncate">
                      {spot.address}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-emerald-700 bg-white px-2 py-1 rounded-md border border-emerald-200">
                    {formatDistance(spot.distance)}
                  </span>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}