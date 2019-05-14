export interface IContentAnalyticsMap {
  [contentId: string]: {
    times_accessed: number;
    last_time_used: string;
  };
}
