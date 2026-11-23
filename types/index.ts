export interface Spot {
  id: number;
  name: string;
  category: string;
  address: string;
  is_free: boolean;
  hours?: string;
  url?: string;
  latitude: number;
  longitude: number;
  created_at?: string;
}