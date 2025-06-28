'use client'

import React, { useEffect, useState } from "react";
import { useParams } from 'next/navigation';
import { Alert as AlertType } from "../../../lib/alerts";
import { fetchAudioUrl } from "../../../lib/api";
import { formatLocalTime } from "../../../lib/date";
import "../../styles.css";

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
      
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 128px)' }}>
        {/* Sidebar */}
        <aside style={{ width: '250px', background: 'white', borderRight: '1px solid #ddd', padding: '1rem' }}>
          <nav>
            <div style={{ marginBottom: '2rem' }}>
              <button
                onClick={goHome}
                style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, padding: '10px 0', cursor: 'pointer', fontWeight: 500, marginBottom: '10px' }}
              >
                Home
              </button>
              <button
                onClick={handleLogout}
                style={{ width: '100%', background: '#eee', border: 'none', borderRadius: 4, padding: '10px 0', cursor: 'pointer', fontWeight: 500 }}
              >
                Logout
              </button>
            </div>
          </nav>
        </aside>
        
        {/* Main Content */}
        <div style={{ flex: 1, padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: '24px', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>
            {alert.classifier_label}
            <span style={{ fontSize: '0.9rem', color: '#2563eb', fontWeight: 500, marginLeft: '12px' }}>
              {typeof alert.classifier_score === 'number' && !isNaN(alert.classifier_score)
                ? alert.classifier_score.toFixed(2)
                : 'N/A'}
            </span>
          </h2>
          
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
            {formatLocalTime(alert.timestamp)}
          </p>

          {audioUrl && (
            <div style={{ marginBottom: '1.5rem' }}>
              <audio controls style={{ width: '100%' }} src={audioUrl}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, fontSize: '1.05rem', color: '#222', lineHeight: '1.5' }}>
              {alert.transcript}
            </p>
          </div>

          <div style={{ fontSize: '0.98rem', color: '#333' }}>
            <p style={{ margin: '6px 0' }}>
              <strong>📍 Location:</strong> {alert.location}
            </p>
            <p style={{ margin: '6px 0' }}>
              <strong>📡 Feed:</strong> {alert.feed}
            </p>
            <p style={{ margin: '6px 0' }}>
              <strong>🔍 Police Code:</strong> {alert.keyword}
            </p>
            {audioUrl && (
              <p style={{ margin: '6px 0' }}>
                <strong>📥 Download:</strong>{' '}
                <a href={audioUrl} onClick={handleDownload} style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500 }}>
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
