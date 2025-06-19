'use client'

import { DateTime, Settings } from 'luxon'
Settings.defaultZone = 'utc'
import React, { useEffect, useState } from "react";
import "./styles.css";
import "./responsive.css";

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

  // Fetch feeds on mount
  useEffect(() => {
    fetch('/api/feeds')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) data = [];
        setFeeds(data);
      })
      .catch(err => {
        console.error('Failed to fetch feeds:', err);
        setFeeds([]);
      });
  }, []);

  // Defensive fetch for alerts
  const fetchAlerts = async (reset = false, pageOverride?: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', String(pageOverride ?? page));
    params.append('limit', '15');
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
      console.error('Failed to fetch alerts:', err);
      data = [];
    }
    if (reset) {
      setAlerts(data);
    } else {
      setAlerts((prev) => [...prev, ...data]);
    }
    setHasMore(data.length === 15);
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

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 100 &&
      !loading &&
      hasMore
    ) {
      setPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading]);

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

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      {/* Header */}
      <header className="header">
        <h1>CopScanner Alerts</h1>
      </header>
      <div className="main-container" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Sidebar */}
        <aside className="sidebar">
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
                  style={selectedFeed === feed ? { cursor: 'pointer', background: '#2563eb', color: '#fff', fontWeight: 600, borderLeft: '4px solid #60a5fa', boxShadow: '0 1px 4px #cbd5e133' } : { cursor: 'pointer' }}
                >
                  {feed}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="content">
          <div className="filters" style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', background: 'white', borderBottom: '1px solid #ddd', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search events"
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
              style={{ fontSize: '1.25rem', padding: '0.75rem 1.25rem', borderRadius: 8, border: '1px solid #bbb', width: 320, minWidth: 200, fontWeight: 500 }}
            />
            <select
              value={classifierFilter}
              onChange={(e) => setClassifierFilter(e.target.value)}
              style={{ fontSize: '1.25rem', padding: '0.75rem 1.25rem', borderRadius: 8, border: '1px solid #bbb', minWidth: 200, width: 200, fontWeight: 500, height: '56px' }}
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
              style={{ fontSize: '1.25rem', padding: '0.75rem 1.25rem', borderRadius: 8, border: '1px solid #bbb', width: 140, fontWeight: 500 }}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Max Score"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              style={{ fontSize: '1.25rem', padding: '0.75rem 1.25rem', borderRadius: 8, border: '1px solid #bbb', width: 140, fontWeight: 500 }}
            />
          </div>
          <div className="alerts-container" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
            {/* Events List */}
            <section
              className="alerts-list"
              style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 120px)', minWidth: 350 }}
              onScroll={handleScroll}
            >
              {filteredAlerts.map((alert, idx) => (
                <div
                  key={alert.timestamp + alert.feed + idx}
                  className={`alert-item ${selectedAlert?.timestamp === alert.timestamp ? "active" : ""}`}
                  onClick={() => setSelectedAlert(alert)}
                  style={selectedAlert?.timestamp === alert.timestamp ? { background: '#e0e7ef', color: '#1e293b', fontWeight: 600, borderLeft: '4px solid #2563eb', boxShadow: '0 1px 4px #cbd5e133' } : {}}
                >
                  <p className="alert-title">
                    {alert.classifier_label}
                    <span className="alert-score">
                      {typeof alert.classifier_score === 'number' && !isNaN(alert.classifier_score)
                        ? alert.classifier_score.toFixed(2)
                        : 'N/A'}
                    </span>
                  </p>
                  <p className="alert-timestamp">{formatLocalTime(alert.timestamp)}</p>
                </div>
              ))}
              {loading && <p>Loading...</p>}
            </section>

            {/* Detail Panel */}
            <section className="alert-details">
              {selectedAlert && (
                <>
                  <div className="audio-container">
                    <video controls autoPlay style={{ width: '100%', height: 90 }} {...{ name: "media" }}>
                      <source src={audioUrl ?? "#"} type="audio/wav" />
                      Your browser does not support the audio element.
                    </video>
                  </div>
                  <div className="alert-transcript">
                    {selectedAlert.transcript}
                  </div>
                  <div className="alert-info">
                    <p><strong>📍 Location:</strong> {selectedAlert.location}</p>
                    <p><strong>🔗 URL:</strong> <a href={selectedAlert.source_url} target="_blank" rel="noopener noreferrer">Feed</a></p>
                    <p><strong>🔍 Keyword:</strong> {selectedAlert.keyword}</p>
                  </div>
                </>
              )}
            </section>
          </div>
        </main>
      </div>
      {/* Footer */}
      <footer className="footer" style={{ position: 'fixed', left: 0, bottom: 0, width: '100%', background: 'white', borderTop: '1px solid #ddd', textAlign: 'center', fontSize: '0.875rem', color: '#666', padding: '1rem', zIndex: 100 }}>
        &copy; 2025 CopScanner Alerts. All rights reserved. | v1.0.0
      </footer>
    </div>
  )
}
