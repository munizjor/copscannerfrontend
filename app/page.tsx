'use client'

import { DateTime, Settings } from 'luxon'
Settings.defaultZone = 'utc'
import React, { useEffect, useState } from "react";
import "./styles.css";
import "./responsive.css";

const PAGE_SIZE = 15;
const VIDEO_HEIGHT = 90;

interface Alert {
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

function formatLocalTime(timestampString: string) {
  // Parse as UTC, then convert to America/New_York and format
  return DateTime.fromSQL(timestampString, { zone: 'utc' })
    .setZone('America/New_York')
    .toFormat('M/d/yyyy, h:mm:ss a')
}

export default function Home() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [classifierFilter, setClassifierFilter] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [keywordFilter, setKeywordFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [feeds, setFeeds] = useState<string[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<string>("");
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch feeds on mount
  useEffect(() => {
    fetch('/api/feeds')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) data = [];
        setFeeds(data);
        setError(null);
      })
      .catch(err => {
        setError('Failed to fetch feeds. Please try again later.');
        setFeeds([]);
      });
  }, []);

  // Defensive fetch for alerts
  const fetchAlerts = async (reset = false, pageOverride?: number) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.append('page', String(pageOverride ?? page));
    params.append('limit', String(PAGE_SIZE));
    if (classifierFilter) params.append('classifier', classifierFilter);
    if (keywordFilter) params.append('keyword', keywordFilter);
    if (minScore) params.append('minScore', minScore);
    if (maxScore) params.append('maxScore', maxScore);
    if (selectedFeed) params.append('feed', selectedFeed);
    let data: Alert[] = [];
    try {
      const res = await fetch(`/api/alerts?${params.toString()}`);
      data = await res.json();
      if (!Array.isArray(data)) data = [];
    } catch (err) {
      setError('Failed to fetch alerts. Please try again later.');
      data = [];
    }
    if (reset) {
      setAlerts(data);
    } else {
      setAlerts((prev) => [...prev, ...data]);
    }
    setHasMore(data.length === PAGE_SIZE);
    setLoading(false);
  };

  // Fetch on page change (infinite scroll)
  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line
  }, [page]);

  // Fetch on filter change (reset to page 1)
  useEffect(() => {
    setPage(1);
    fetchAlerts(true, 1);
    // eslint-disable-next-line
  }, [classifierFilter, keywordFilter, minScore, maxScore]);

  // Fetch alerts when selectedFeed changes
  useEffect(() => {
    setPage(1);
    fetchAlerts(true, 1);
    // eslint-disable-next-line
  }, [selectedFeed]);

  // Update handleScroll to use the event's target (alerts-list)
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    if (
      target.scrollHeight - target.scrollTop - target.clientHeight < 100 &&
      !loading &&
      hasMore
    ) {
      setPage((prev) => prev + 1);
    }
  };

  // Remove filtering and sorting here, just use alerts as is
  const filteredAlerts = alerts;

  // When a new alert is selected, update the audio element to reload the new source
  useEffect(() => {
    const audio = document.querySelector('.audio-container audio, .audio-container video') as HTMLMediaElement | null;
    if (audio) {
      audio.load();
    }
  }, [selectedAlert, audioUrl]);

  // Fetch presigned URL when selectedAlert changes
  useEffect(() => {
    if (selectedAlert && selectedAlert.audio_path) {
      setAudioUrl(null);
      let key = selectedAlert.audio_path;
      try {
        // If audio_path is a full URL, use only the last path component (filename)
        const url = new URL(key);
        key = url.pathname.split('/').pop() || '';
      } catch {
        // If not a URL, use as is
      }
      // Remove alert_audio/ prefix if present
      if (key.startsWith('alert_audio/')) {
        key = key.replace(/^alert_audio\//, '');
      }
      fetch(`/api/audio?key=${encodeURIComponent(key)}`)
        .then(res => res.json())
        .then(data => {
          setAudioUrl(data.url)
        })
        .catch(() => {
          setAudioUrl(null);
        });
    } else {
      setAudioUrl(null);
    }
  }, [selectedAlert]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Periodically fetch new alerts and notify
  useEffect(() => {
    const interval = setInterval(async () => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '15');
      if (classifierFilter) params.append('classifier', classifierFilter);
      if (keywordFilter) params.append('keyword', keywordFilter);
      if (minScore) params.append('minScore', minScore);
      if (maxScore) params.append('maxScore', maxScore);
      if (selectedFeed) params.append('feed', selectedFeed);
      const res = await fetch(`/api/alerts?${params.toString()}`);
      const data = await res.json();
      if (data.length > 0 && (!alerts.length || data[0].timestamp !== alerts[0].timestamp)) {
        // Prepend only new alerts
        const newAlerts = (data as Alert[]).filter((a: Alert) => !alerts.some((b: Alert) => b.timestamp === a.timestamp && b.feed === a.feed));
        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev]);
          // Show browser notification for each new alert
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            newAlerts.forEach(alert => {
              new Notification('New Police Scanner Alert', {
                body: `${alert.feed} - ${alert.location}\n${alert.transcript?.slice(0, 80)}`,
                icon: '/favicon.ico'
              });
            });
          }
        }
      }
    }, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, [classifierFilter, keywordFilter, minScore, maxScore, selectedFeed, alerts]);

  // AlertCard component for each alert in the list
  interface AlertCardProps {
    alert: Alert;
    isSelected: boolean;
    onClick: () => void;
  }
  function AlertCard({ alert, isSelected, onClick }: AlertCardProps) {
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

  // AlertDetail component for the right panel
  interface AlertDetailProps {
    alert: Alert;
    audioUrl: string | null;
  }
  function AlertDetail({ alert, audioUrl }: AlertDetailProps) {
    if (!alert) return null;
    return (
      <>
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
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1>CopScanner Alerts</h1>
      </header>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <div className="main-container">
        {/* Sidebar */}
        <aside className="sidebar" aria-label="Feed selection">
          <h2>Feed</h2>
          <nav>
            <ul>
              {Array.isArray(feeds) && feeds.map(feed => (
                <li
                  key={feed}
                  className={selectedFeed === feed ? "active" : ""}
                  onClick={() => {
                    setSelectedFeed(feed);
                  }}
                >
                  {feed}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="content" aria-label="Main content">
          <div className="filters">
            <input
              type="text"
              placeholder="Search events"
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
              className="filter-input"
              aria-label="Search events"
            />
            <select
              value={classifierFilter}
              onChange={(e) => setClassifierFilter(e.target.value)}
              className="filter-select"
              aria-label="Classifier filter"
            >
              <option value="">Classifier</option>
              <option value="violent crime">Violent Crime</option>
              <option value="non-violent">Non-violent</option>
              <option value="unrelated">Unrelated</option>
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Min Score"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="filter-min-score"
              style={{ display: 'none' }}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Max Score"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              className="filter-max-score"
              style={{ display: 'none' }}
            />
          </div>
          <div className="alerts-container">
            {/* Events List */}
            <section
              className="alerts-list"
              onScroll={handleScroll}
            >
              {filteredAlerts.map((alert, idx) => (
                <AlertCard
                  key={alert.timestamp + alert.feed + idx}
                  alert={alert}
                  isSelected={selectedAlert?.timestamp === alert.timestamp}
                  onClick={() => setSelectedAlert(alert)}
                />
              ))}
              {loading && <p>Loading...</p>}
            </section>

            {/* Detail Panel */}
            <section className="alert-details">
              {selectedAlert && (
                <AlertDetail alert={selectedAlert} audioUrl={audioUrl} />
              )}
            </section>
          </div>
        </main>
      </div>
      {/* Footer */}
      <footer className="footer">
        &copy; 2025 CopScanner Alerts. All rights reserved. | v1.0.0
      </footer>
    </div>
  )
}
