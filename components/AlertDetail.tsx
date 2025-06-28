import React from "react";
import { Alert as AlertType } from "../lib/alerts";
import styles from "./AlertDetail.module.css";

interface AlertDetailProps {
  alert: AlertType;
  audioUrl: string | null;
  onClose: () => void;
}

export function AlertDetail({ alert, audioUrl, onClose }: AlertDetailProps) {
  if (!alert) return null;
  const VIDEO_HEIGHT = 90;

  const handleDownload = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!audioUrl) return;

    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `alert_${alert.timestamp.replace(/[:\s]/g, '_')}.wav`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className={styles.container}>
      <button
        onClick={onClose}
        aria-label="Close"
        className={styles.closeButton}
      >
        ×
      </button>
      <div className={styles.audioContainer}>
        <audio controls className={styles.audio} src={audioUrl ?? undefined}>
          Your browser does not support the audio element.
        </audio>
      </div>
      <div className={styles.alertTranscript}>
        {alert.transcript}
      </div>
      <div className={styles.alertInfo}>
        <p><strong>📍 Location:</strong> {alert.location}</p>
        <p><strong>🔍 Police Code:</strong> {alert.keyword}</p>
        {audioUrl && (
          <p><strong>📥 Download:</strong>{' '}
            <a href={audioUrl} onClick={handleDownload} className={styles.downloadLink}>
              Download Audio
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
