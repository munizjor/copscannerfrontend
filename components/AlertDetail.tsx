import React from "react";
import { Alert as AlertType } from "../lib/alerts";

interface AlertDetailProps {
  alert: AlertType;
  audioUrl: string | null;
  onClose: () => void;
}

export function AlertDetail({ alert, audioUrl, onClose }: AlertDetailProps) {
  if (!alert) return null;
  const VIDEO_HEIGHT = 90;
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'transparent',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          color: '#888',
          zIndex: 2
        }}
      >
        ×
      </button>
      <div className="audio-container">
        <video controls style={{ width: '100%', height: VIDEO_HEIGHT }} {...{ name: "media" }}>
          <source src={audioUrl ?? "#"} type="audio/wav" />
          <audio controls>
            <source src={audioUrl ?? "#"} type="audio/wav" />
            Your browser does not support the audio or video element.
          </audio>
        </video>
      </div>
      <div className="alert-transcript">
        {alert.transcript}
      </div>
      <div className="alert-info">
        <p><strong>📍 Location:</strong> {alert.location}</p>
        <p><strong>🔗 URL:</strong> <a href={alert.source_url} target="_blank" rel="noopener noreferrer">Feed</a></p>
        <p><strong>🔍 Keyword:</strong> {alert.keyword}</p>
      </div>
    </div>
  );
}
