export interface IContentStatsResult {
  _id?: string;
  path: string;
  type?: string;
  title: string;
  total_content_items: number;
  created_date: string;
  last_active: string;
  last_time_used: string;
  times_accessed: number;
  active_favorites: number;
  products: {
    engage: boolean;
    focus: boolean;
    rehab: boolean;
  };
  platforms?: string;
}
