import React from "react";
import { formatLocalTime } from "../lib/date";
import { Alert as AlertType } from "../lib/alerts";
import styles from "./AlertCard.module.css";

interface AlertCardProps {
  alert: AlertType;
  isSelected: boolean;
  onClick: () => void;
}

export function AlertCard({ alert, isSelected, onClick }: AlertCardProps) {
  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card onClick
    const alertUrl = `${window.location.origin}/alert/${alert.id}`;
    navigator.clipboard.writeText(alertUrl).then(() => {
      // Visual feedback - you could replace this with a toast notification
      const button = e.target as HTMLElement;
      const originalText = button.textContent;
      button.textContent = '✓';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
    }).catch(() => {
      // Fallback for older browsers
      window.alert('Link copied: ' + alertUrl);
    });
  };

  return (
    <div
      className={[
        styles.alertItem,
        `alert-item alert-id-${alert.id}`,
        isSelected ? styles.active : ""
      ].join(" ")}
      onClick={onClick}
      role="button"
      aria-pressed={isSelected}
      aria-label={`Alert: ${alert.classifier_label}, ${formatLocalTime(alert.timestamp)}`}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
          e.currentTarget.blur(); // Remove focus after activation
        }
      }}
    >
      <div className={styles.alertHeader}>
        <p className={styles.alertTitle}>
          {alert.classifier_label}
          <span className={styles.alertScore}>
            {typeof alert.classifier_score === 'number' && !isNaN(alert.classifier_score)
              ? alert.classifier_score.toFixed(2)
              : 'N/A'}
          </span>
        </p>
        <button
          className={styles.shareButton}
          onClick={handleShareClick}
          title="Share alert"
          aria-label="Share this alert"
        >
          📤
        </button>
      </div>
      <p className={styles.alertSnippet}>
        {alert.transcript.slice(0, 50)}...
      </p>
      <p className={styles.alertTimestamp}>{formatLocalTime(alert.timestamp)}</p>
    </div>
  );
}
