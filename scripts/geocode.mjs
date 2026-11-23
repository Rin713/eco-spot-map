// scripts/geocode.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uypyljvgihxhhbuhpvuh.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_publishable_JxHD1dOc6fVrSMp1bc7GxQ_relJtEfq'; // 更新が弾かれる場合は secret / service_role キーに変更

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 建物名・階数などを削って番地までの住所に整える
function cleanAddress(address) {
  return address
    .split(/\s+/)[0]
    .replace(/丁目/g, '-')
    .replace(/番地|番/g, '-')
    .replace(/号/g, '');
}

async function geocodeAddress(address) {
  const query = encodeURIComponent(cleanAddress(address));
  const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${query}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const [lng, lat] = data[0].geometry.coordinates;
  return { lat, lng };
}

async function main() {
  const { data: spots, error } = await supabase
    .from('spots')
    .select('name, address')
    .is('latitude', null);

  if (error) {
    console.error('取得エラー:', error);
    return;
  }

  console.log(`対象件数: ${spots.length} 件`);

  for (const spot of spots) {
    const coords = await geocodeAddress(spot.address);

    if (!coords) {
      console.log(`❌ 座標が見つかりませんでした: ${spot.name} (${spot.address})`);
      continue;
    }

    const { error: updateError } = await supabase
      .from('spots')
      .update({
        latitude: coords.lat,
        longitude: coords.lng,
      })
      .eq('name', spot.name)
      .eq('address', spot.address);

    if (updateError) {
      console.error(`❌ 更新エラー (${spot.name}):`, updateError.message);
    } else {
      console.log(`✅ 更新完了: ${spot.name} -> (${coords.lat}, ${coords.lng})`);
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('完了しました！');
}

main();