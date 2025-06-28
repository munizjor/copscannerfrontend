'use client'

import React, { useEffect, useState } from "react";
import { useParams } from 'next/navigation';
import { Alert as AlertType } from "../../../lib/alerts";
import { fetchAudioUrl } from "../../../lib/api";
import { formatLocalTime } from "../../../lib/date";
import "../../styles.css";
import "../alert.css";

export default function AlertPage() {
  const params = useParams();
  const alertId = params.id as string;
  const [alert, setAlert] = useState<AlertType | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!alertId) return;

    const fetchAlert = async () => {
      try {
        const res = await fetch(`/api/alerts/${alertId}`);
        if (!res.ok) {
          throw new Error('Alert not found');
        }
        const data = await res.json();
        setAlert(data);
        
        // Fetch audio URL if available
        if (data.audio_path) {
          const audioUrl = await fetchAudioUrl(data.audio_path);
          setAudioUrl(audioUrl);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load alert');
      } finally {
        setLoading(false);
      }
    };

    fetchAlert();
  }, [alertId]);

  const handleDownload = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!audioUrl || !alert) return;

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

  const goHome = () => {
    window.location.href = '/';
  };

  const handleLogout = () => {
    localStorage.removeItem('userLogin');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="app-container">
        <header className="header">
          <h1>Sherlock IQ</h1>
        </header>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading alert...</p>
        </div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="app-container">
        <header className="header">
          <h1>Sherlock IQ</h1>
        </header>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Alert not found</p>
          <button onClick={goHome} style={{ padding: '10px 20px', marginTop: '1rem', cursor: 'pointer' }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>Sherlock IQ</h1>
      </header>
      
      <div className="alertPageContainer">
        {/* Sidebar */}
        <aside className="alertPageSidebar">
          <nav className="alertPageNav">
            <button
              onClick={goHome}
              className="alertPageButton alertPageButtonPrimary"
            >
              Home
            </button>
            <button
              onClick={handleLogout}
              className="alertPageButton alertPageButtonSecondary"
            >
              Logout
            </button>
          </nav>
        </aside>
        
        {/* Main Content */}
        <div className="alertPageMain">          <div className="alertPageCard">
            <h2 className="alertPageTitle">
              {alert.classifier_label}
              <span className="alertPageScore">
                {typeof alert.classifier_score === 'number' && !isNaN(alert.classifier_score)
                  ? alert.classifier_score.toFixed(2)
                  : 'N/A'}
              </span>
            </h2>
            
            <p className="alertPageTimestamp">
              {formatLocalTime(alert.timestamp)}
            </p>

            {audioUrl && (
              <div className="alertPageAudio">
                <audio controls style={{ width: '100%', maxWidth: '100%' }} src={audioUrl}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            <div className="alertPageTranscript">
              {alert.transcript}
            </div>

            <div className="alertPageInfo">
              <p className="alertPageInfoItem">
                <strong>📍 Location:</strong> {alert.location}
              </p>
              <p className="alertPageInfoItem">
                <strong>📡 Feed:</strong> {alert.feed}
              </p>
              <p className="alertPageInfoItem">
                <strong>🔍 Police Code:</strong> {alert.keyword}
              </p>
              {audioUrl && (
                <p className="alertPageInfoItem">
                  <strong>📥 Download:</strong>{' '}
                  <a href={audioUrl} onClick={handleDownload} className="alertPageLink">
                    Download Audio
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <footer className="footer">
        &copy; 2025 Sherlock IQ. All rights reserved. | v1.0.0
      </footer>
    </div>
  );
}
