// lib/api.ts
import { extractAudioKey } from "../lib/audio";

export async function fetchFeeds() {
  const res = await fetch('/api/feeds');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchAlerts({
  page,
  pageSize,
  classifierFilter,
  keywordFilter,
  minScore,
  maxScore,
  selectedFeed
}: {
  page: number,
  pageSize: number,
  classifierFilter?: string,
  keywordFilter?: string,
  minScore?: string,
  maxScore?: string,
  selectedFeed?: string
}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(pageSize));
  if (classifierFilter) params.append('classifier', classifierFilter);
  if (keywordFilter) params.append('keyword', keywordFilter);
  if (minScore) params.append('minScore', minScore);
  if (maxScore) params.append('maxScore', maxScore);
  if (selectedFeed) params.append('feed', selectedFeed);
  const res = await fetch(`/api/alerts?${params.toString()}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchAudioUrl(audioPath: string) {
  const key = extractAudioKey(audioPath);
  const res = await fetch(`/api/audio?key=${encodeURIComponent(key)}`);
  const data = await res.json();
  return data.url;
}
