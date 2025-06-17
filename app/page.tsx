'use client'

import { DateTime, Settings } from 'luxon'
Settings.defaultZone = 'utc'
import { useEffect, useState } from 'react'

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
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20
  const totalPages = Math.ceil(alerts.length / pageSize)
  const paginatedAlerts = alerts.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    // Request notification permission on mount
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }

    let lastAlertTimestamp: string | null = null
    // Initial fetch
    fetch('/api/alerts')
      .then(res => res.json())
      .then(data => {
        setAlerts(data)
        if (data.length > 0) lastAlertTimestamp = data[0].timestamp
      })

    // Poll every 10 seconds for new alerts
    const interval = setInterval(() => {
      fetch('/api/alerts')
        .then(res => res.json())
        .then(data => {
          // Detect new alert
          if (data.length > 0 && data[0].timestamp !== lastAlertTimestamp) {
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              const alert = data[0]
              new Notification('New Police Scanner Alert', {
                body: `${alert.feed} - ${alert.location}\n${alert.transcript?.slice(0, 80)}`,
                icon: '/favicon.ico'
              })
            }
            lastAlertTimestamp = data[0].timestamp
          }
          setAlerts(data)
        })
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const getS3KeyFromPath = (audioPath: string) => {
    // If audioPath is a full URL, extract the key after the last '/'
    try {
      const url = new URL(audioPath)
      return decodeURIComponent(url.pathname.replace(/^\//, ''))
    } catch {
      // If not a URL, return as is
      return audioPath
    }
  }

  const openModal = async (audioPath: string) => {
    const key = getS3KeyFromPath(audioPath)
    const res = await fetch(`/api/audio?key=${encodeURIComponent(key)}`)
    const data = await res.json()
    if (data.url) {
      setAudioUrl(data.url)
      setShowModal(true)
    } else {
      alert('Audio unavailable or failed to load.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%)' }}>
      <header style={{ padding: '40px 0', background: '#f9fafb', boxShadow: '0 2px 8px rgba(30,58,138,0.04)', position: 'relative', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', color: '#22223b', letterSpacing: '0.04em', marginBottom: 0 }}>
          Police Scanner Alerts
        </h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginTop: 8, fontSize: '1.125rem', fontWeight: 500 }}>Live audio & incident feed</p>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #60a5fa, #cbd5e1, #60a5fa)' }}></div>
      </header>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: '100%', padding: '32px 8px' }}>
        <div style={{ width: '100%', maxWidth: 1200, borderRadius: 24, boxShadow: '0 4px 24px rgba(30,58,138,0.07)', background: 'white', padding: 32, border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22223b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, background: '#38bdf8', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
              Recent Alerts
            </h2>
          </div>
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px #cbd5e133' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.97rem' }}>
              <thead style={{ background: '#f1f5f9', color: '#22223b', borderBottom: '2px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'left' }}>Timestamp</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'left' }}>Feed</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'left' }}>Location</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'left' }}>URL</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'left' }}>Transcript</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'left' }}>Keyword</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'left' }}>Classifier</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'left' }}>Score</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Audio</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAlerts.length > 0 ? paginatedAlerts.map((a, i) => (
                  <tr key={a.timestamp + a.feed + a.location} style={{ background: (i % 2 === 0 ? '#f8fafc' : 'white'), transition: 'background 0.2s' }}>
                    <td style={{ padding: '8px 16px', whiteSpace: 'nowrap', fontFamily: 'monospace', color: '#334155' }}>
                      {formatLocalTime(a.timestamp)}
                    </td>
                    <td style={{ padding: '8px 16px', color: '#334155' }}>{a.feed}</td>
                    <td style={{ padding: '8px 16px', color: '#334155' }}>{a.location}</td>
                    <td style={{ padding: '8px 16px' }}>
                      <a href={a.source_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 500 }}>Feed</a>
                    </td>
                    <td style={{ padding: '8px 16px', wordBreak: 'break-word', minWidth: 150, color: '#334155' }}>{a.transcript}</td>
                    <td style={{ padding: '8px 16px' }}>
                      <span style={{ display: 'inline-block', background: '#f1f5f9', color: '#0e7490', padding: '2px 8px', borderRadius: 8, fontWeight: 600, border: '1px solid #bae6fd', fontSize: '0.97em' }}>{a.keyword}</span>
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <span style={{ display: 'inline-block', background: '#e0e7ef', color: '#2563eb', padding: '2px 8px', borderRadius: 8, fontWeight: 600, border: '1px solid #c7d2fe', fontSize: '0.97em' }}>{a.classifier_label}</span>
                    </td>
                    <td style={{ padding: '8px 16px', color: '#2563eb' }}>{a.classifier_score !== null && a.classifier_score !== undefined ? Number(a.classifier_score).toFixed(2) : ''}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                      {a.audio_path ? (
                        <button
                          type="button"
                          style={{ padding: '4px 16px', background: 'linear-gradient(90deg, #60a5fa, #2563eb)', color: 'white', borderRadius: 8, boxShadow: '0 2px 8px #60a5fa22', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '1em', transition: 'background 0.2s' }}
                          onClick={e => { e.stopPropagation(); openModal(a.audio_path!) }}
                        >
                          ▶ Play
                        </button>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Unavailable</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px 16px', color: '#6b7280', fontSize: '1.125rem' }}>
                      No alerts in the past 12 hours.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f1f5f9' : '#2563eb', color: currentPage === 1 ? '#94a3b8' : 'white', fontWeight: 600, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '1em' }}
                >
                  Previous
                </button>
                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      background: currentPage === pageNum ? '#2563eb' : 'white',
                      color: currentPage === pageNum ? 'white' : '#2563eb',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '1em',
                      margin: '0 2px',
                    }}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f1f5f9' : '#2563eb', color: currentPage === totalPages ? '#94a3b8' : 'white', fontWeight: 600, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '1em' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
          {/* Audio Modal */}
          {showModal && audioUrl && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,41,59,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
              <div style={{ background: 'white', borderRadius: 16, padding: 32, minWidth: 320, boxShadow: '0 8px 32px #33415533', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 24, color: '#64748b', cursor: 'pointer' }}>&times;</button>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16, color: '#22223b' }}>Audio Playback</h3>
                <audio src={audioUrl} controls autoPlay style={{ width: 280, outline: 'none', borderRadius: 8, marginBottom: 8 }} />
                <span style={{ color: '#64748b', fontSize: '0.97em' }}>Click outside to close</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
