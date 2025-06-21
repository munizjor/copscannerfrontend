import React from "react";
import { formatLocalTime } from "../lib/date";
import { Alert as AlertType } from "../lib/alerts";

interface AlertCardProps {
  alert: AlertType;
  isSelected: boolean;
  onClick: () => void;
}

export function AlertCard({ alert, isSelected, onClick }: AlertCardProps) {
  return (
    <div
      className={`alert-item${isSelected ? " active" : ""}`}
      onClick={onClick}
      role="button"
      aria-pressed={isSelected}
      aria-label={`Alert: ${alert.classifier_label}, ${formatLocalTime(alert.timestamp)}`}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={
        isSelected
          ? {
              background: '#e0e7ef',
              color: '#1e293b',
              fontWeight: 600,
              borderLeft: '4px solid #2563eb',
              boxShadow: '0 1px 4px #cbd5e133',
            }
          : {}
      }
    >
      <p className="alert-title">
        {alert.classifier_label}
        <span className="alert-score">
          {typeof alert.classifier_score === 'number' && !isNaN(alert.classifier_score)
            ? alert.classifier_score.toFixed(2)
            : 'N/A'}
        </span>
      </p>
      <p className="alert-snippet">
        {alert.transcript.slice(0, 50)}...
      </p>
      <p className="alert-timestamp">{formatLocalTime(alert.timestamp)}</p>
    </div>
  );
}
