// lib/alerts.ts

/**
 * Alert interface for type reuse.
 */
export interface Alert {
  id: number;
  timestamp: string;
  feed: string;
  location: string;
  source_url: string;
  transcript: string;
  keyword: string;
  classifier_label: string;
  classifier_score: number;
  audio_path: string | null;
}

/**
 * Filter alerts by keyword, classifier, min/max score, and feed.
 */
export function filterAlerts(alerts: Alert[], {
  keywordFilter = "",
  classifierFilter = "",
  minScore = "",
  maxScore = "",
  selectedFeed = ""
}: {
  keywordFilter?: string,
  classifierFilter?: string,
  minScore?: string,
  maxScore?: string,
  selectedFeed?: string
}) {
  return alerts.filter(alert => {
    if (keywordFilter && !alert.transcript.toLowerCase().includes(keywordFilter.toLowerCase())) return false;
    if (classifierFilter && alert.classifier_label !== classifierFilter) return false;
    if (minScore && (!alert.classifier_score || alert.classifier_score < parseFloat(minScore))) return false;
    if (maxScore && (!alert.classifier_score || alert.classifier_score > parseFloat(maxScore))) return false;
    if (selectedFeed && alert.feed !== selectedFeed) return false;
    return true;
  });
}

/**
 * Sort alerts by timestamp descending (most recent first).
 */
export function sortAlerts(alerts: Alert[]) {
  return [...alerts].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
