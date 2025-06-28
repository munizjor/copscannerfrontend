import { Alert } from "../lib/alerts";
import { formatLocalTime } from "../lib/date";

export function getAlertNotificationContent(alert: Alert) {
  // Compose notification title and body to match AlertCard
  const title = `${alert.classifier_label} (${typeof alert.classifier_score === 'number' && !isNaN(alert.classifier_score) ? alert.classifier_score.toFixed(2) : 'N/A'})`;
  const body = `${alert.transcript.slice(0, 50)}...\n${formatLocalTime(alert.timestamp)}`;
  return { title, body };
}
