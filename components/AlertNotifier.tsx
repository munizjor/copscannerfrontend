"use client";
import { useEffect, useRef, useState } from 'react';
import { getAlertNotificationContent } from './alertNotificationContent';
import { Alert } from '../lib/alerts';

const POLL_INTERVAL = 30000; // 30 seconds

export default function AlertNotifier() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const lastAlertId = useRef<number | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(setPermission);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function pollAlerts() {
      try {
        const res = await fetch('/api/alerts?limit=1');
        if (!res.ok) return;
        const data = await res.json();
        const latest: Alert | undefined = Array.isArray(data) ? data[0] : data?.alerts?.[0];
        if (latest) {
          const latestId = typeof latest.id === 'number' ? latest.id : parseInt(latest.id as string, 10);
          if (permission === 'granted') {
            if (lastAlertId.current === null || (!firstRun.current && latestId !== lastAlertId.current)) {
              const { title, body } = getAlertNotificationContent(latest);
              new Notification(title, { body });
            }
          }
          lastAlertId.current = latestId;
        }
        firstRun.current = false;
      } catch (e) {
        // Ignore errors
      }
    }
    pollAlerts();
    interval = setInterval(pollAlerts, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [permission]);

  return null;
}
