'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'eco_spot_map_refill_count_v1';
const BOTTLE_ML = 500;

export default function RefillCounter() {
  const [count, setCount] = useState<number>(0);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = Number.parseInt(saved, 10);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          setCount(parsed);
        }
      }
    } catch {
      // ストレージが使えない環境は無視
    }
  }, []);

  const updateCount = (next: number) => {
    const safeNext = Math.max(0, next);
    setCount(safeNext);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(safeNext));
    } catch {
      // 無視
    }
  };

  const totalLiters = ((count * BOTTLE_ML) / 1000).toFixed(1);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-slate-800 text-sm">
          💧 マイボトル給水ログ
        </h2>
        <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
          500mlペットボトル換算
        </span>
      </div>

      <div className="flex items-baseline justify-between my-3 bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-3">
        <div>
          <p className="text-[11px] text-slate-500">累計給水回数</p>
          <p className="text-2xl font-extrabold text-emerald-700">
            {mounted ? count : 0} <span className="text-xs font-semibold text-slate-600">回</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-500">ペットボトル削減目安</p>
          <p className="text-sm font-bold text-slate-800">
            約 {mounted ? count : 0} 本 <span className="text-xs font-normal text-slate-500">({mounted ? totalLiters : '0.0'}L)</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateCount(count + 1)}
          className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl hover:bg-emerald-700 active:scale-[0.99] transition"
        >
          ＋ 給水した！
        </button>

        {mounted && count > 0 && (
          <>
            <button
              type="button"
              onClick={() => updateCount(count - 1)}
              className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2.5 rounded-xl transition"
              title="1回減らす"
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('給水カウントを0にリセットしますか？')) {
                  updateCount(0);
                }
              }}
              className="text-xs font-medium text-slate-400 hover:text-red-500 px-2 py-2.5 transition"
              title="リセット"
            >
              リセット
            </button>
          </>
        )}
      </div>
    </div>
  );
}