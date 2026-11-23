'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SpotFormProps {
  onSpotAdded?: () => void;
}

export default function SpotForm({ onSpotAdded }: SpotFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('給水スポット');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [hours, setHours] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setMessage({ type: 'error', text: '緯度・経度は正しい数値を入力してください。' });
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('spots').insert([
      {
        name,
        category,
        address,
        latitude: lat,
        longitude: lng,
        hours: hours || null,
      },
    ]);

    if (error) {
      console.error('登録エラー:', error);
      setMessage({ type: 'error', text: `登録に失敗しました: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'スポットを登録しました！' });
      setName('');
      setAddress('');
      setLatitude('');
      setLongitude('');
      setHours('');

      if (onSpotAdded) {
        onSpotAdded();
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div>
      <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
        ➕ 新しいスポットを登録
      </h2>

      {message && (
        <div
          className={`p-3 rounded-lg mb-4 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            スポット名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 中之島公園 給水スポット"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            カテゴリ <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          >
            <option value="給水スポット">給水スポット</option>
            <option value="マイ容器対応店">マイ容器対応店</option>
            <option value="リサイクル拠点">リサイクル拠点</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">住所</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="例: 大阪府大阪市北区中之島1"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              緯度 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="34.6937"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              経度 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="135.5022"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">利用可能時間</label>
          <input
            type="text"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="例: 9:00 - 17:00"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 text-white font-semibold text-sm py-2.5 px-4 rounded-lg hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 mt-2"
        >
          {isSubmitting ? '登録処理中...' : 'スポットを追加する'}
        </button>
      </form>
    </div>
  );
}