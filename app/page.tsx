import SpotExplorer from '../components/SpotExplorer';
import { supabase } from '../lib/supabaseClient';
import { Spot } from '../types';

export default async function HomePage() {
  const { data, error } = await supabase
    .from('spots')
    .select('*');

  if (error) {
    console.error('データ取得エラー:', error);
  }

  const spotList = (data as Spot[]) || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ナビゲーションバー */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                エコスポット Map
              </h1>
              <p className="text-xs text-slate-500">
                街のマイボトル給水所 ＆ マイ容器対応スポット
              </p>
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
            登録スポット: {spotList.length} 件
          </div>
        </div>
      </header>

      <SpotExplorer initialSpots={spotList} />
    </div>
  );
}