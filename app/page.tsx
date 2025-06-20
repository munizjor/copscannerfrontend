'use client'

import { DateTime, Settings } from 'luxon'
Settings.defaultZone = 'utc'
import React, { useEffect, useState } from "react";
import "./styles.css";
import "./responsive.css";
import { showNotification, requestNotificationPermission } from "../lib/notifications";
import { fetchFeeds, fetchAlerts, fetchAudioUrl } from "../lib/api";
import { formatLocalTime } from "../lib/date";
import { filterAlerts, sortAlerts, Alert as AlertType } from "../lib/alerts";
import { AlertCard } from "../components/AlertCard";
import { AlertDetail } from "../components/AlertDetail";

const PAGE_SIZE = 15;
const VIDEO_HEIGHT = 90;

export default function Home() {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
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
    fetchFeeds()
      .then(data => {
        setFeeds(data);
        setError(null);
      })
      .catch(err => {
        setError('Failed to fetch feeds. Please try again later.');
        setFeeds([]);
      });
  }, []);

  // Defensive fetch for alerts
  const handleFetchAlerts = async (reset = false, pageOverride?: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAlerts({
        page: pageOverride ?? page,
        pageSize: PAGE_SIZE,
        classifierFilter,
        keywordFilter,
        minScore,
        maxScore,
        selectedFeed
      });
      if (reset) {
        setAlerts(data);
      } else {
        setAlerts((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError('Failed to fetch alerts. Please try again later.');
      if (reset) setAlerts([]);
    }
    setLoading(false);
  };

  // Fetch on page change (infinite scroll)
  useEffect(() => {
    handleFetchAlerts();
    // eslint-disable-next-line
  }, [page]);

  // Fetch on filter change (reset to page 1)
  useEffect(() => {
    setPage(1);
    handleFetchAlerts(true, 1);
    // eslint-disable-next-line
  }, [classifierFilter, keywordFilter, minScore, maxScore]);

  // Fetch alerts when selectedFeed changes
  useEffect(() => {
    setPage(1);
    handleFetchAlerts(true, 1);
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
  const filteredAlerts = sortAlerts(filterAlerts(alerts, {
    keywordFilter,
    classifierFilter,
    minScore,
    maxScore,
    selectedFeed
  }));

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
      fetchAudioUrl(selectedAlert.audio_path)
        .then(url => setAudioUrl(url))
        .catch(() => setAudioUrl(null));
    } else {
      setAudioUrl(null);
    }
  }, [selectedAlert]);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
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
        const newAlerts = (data as AlertType[]).filter((a: AlertType) => !alerts.some((b: AlertType) => b.timestamp === a.timestamp && b.feed === a.feed));
        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev]);
          // Show browser notification for each new alert
          newAlerts.forEach(alert => {
            console.log('Sending notification for alert:', alert);
            showNotification('New Police Scanner Alert', {
              body: `${alert.feed} - ${alert.location}\n${alert.transcript?.slice(0, 80)}`,
              icon: '/favicon.ico'
            });
          });
        }
      }
    }, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, [classifierFilter, keywordFilter, minScore, maxScore, selectedFeed, alerts]);

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
                <AlertDetail alert={selectedAlert} audioUrl={audioUrl} onClose={() => setSelectedAlert(null)} />
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
