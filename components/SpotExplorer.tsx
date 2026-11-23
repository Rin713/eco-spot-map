'use client';

import { useCallback, useEffect, useState } from 'react';
import MapWrapper, { LatLngPoint } from './MapWrapper';
import SpotForm from './SpotForm';
import NearbySpots from './NearbySpots';
import RefillCounter from './RefillCounter';
import { Spot } from '../types';
import { getGoogleMapsUrl } from '../lib/googleMaps';

interface SpotExplorerProps {
  initialSpots: Spot[];
}

export default function SpotExplorer({ initialSpots }: SpotExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userLocation, setUserLocation] = useState<LatLngPoint | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const fetchCurrentLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('このブラウザでは位置情報が使えません。');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('位置情報の利用が許可されていません。ブラウザの設定を確認してください。');
        } else if (err.code === err.TIMEOUT) {
          setLocationError('位置情報の取得がタイムアウトしました。');
        } else {
          setLocationError('現在地を取得できませんでした。');
        }
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // 初回マウント時に現在地を取得（不要ならこの useEffect は消してボタン押下だけでもOK）
  useEffect(() => {
    fetchCurrentLocation();
  }, [fetchCurrentLocation]);

  const categories = Array.from(
    new Set(initialSpots.map((spot) => spot.category).filter(Boolean))
  );

  const filteredSpots = initialSpots.filter((spot) => {
    const matchesCategory =
      selectedCategory === 'all' || spot.category === selectedCategory;

    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      q === '' ||
      spot.name?.toLowerCase().includes(q) ||
      spot.address?.toLowerCase().includes(q);

    return matchesCategory && matchesQuery;
  });

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 左側: 地図セクション */}
      <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[360px] lg:h-[calc(100vh-160px)] lg:sticky lg:top-24">
          <MapWrapper spots={filteredSpots} userLocation={userLocation} />
        </div>
      </section>

      {/* 右側: 検索・フィルター＋サイドバー */}
      <section className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
        {/* ① 検索バー＆カテゴリフィルター */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-slate-800 text-sm">
              スポットを検索・絞り込み
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchCurrentLocation}
                disabled={isLocating}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {isLocating ? '取得中...' : '現在地を取得'}
              </button>
              <span className="text-xs text-slate-500">
                {filteredSpots.length} / {initialSpots.length} 件
              </span>
            </div>
          </div>

          {locationError && (
            <p className="text-xs text-red-600">{locationError}</p>
          )}

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="スポット名や住所で検索..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              すべて
            </button>

            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedCategory === category
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* ② 現在地から1km以内のスポット検索 */}
        <NearbySpots spots={filteredSpots} />

        {/* 給水カウント */}
        <RefillCounter />

        {/* ③ スポット登録フォーム */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <SpotForm />
        </div>

        {/* ④ 絞り込み後のスポット一覧 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="font-bold text-sm tracking-wide uppercase text-slate-400 mb-3">
            絞り込み結果のスポット一覧
          </h2>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {filteredSpots.length === 0 ? (
              <p className="text-xs text-slate-400">
                条件に一致するスポットが見つかりません。
              </p>
            ) : (
              filteredSpots.map((spot, index) => (
                <a
                  key={spot.id || `spot-${index}`}
                  href={getGoogleMapsUrl(spot)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-sm text-slate-800">
                      {spot.name}
                    </h3>
                    <span className="shrink-0 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                      {spot.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{spot.address}</p>
                  <span className="mt-1 inline-block text-[11px] font-medium text-emerald-700 underline">
                    Googleマップで開く
                  </span>
                </a>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}