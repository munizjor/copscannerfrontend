// lib/notifications.ts

/**
 * Show a browser notification (if permitted) and fallback to alert.
 * Returns true if notification was shown, false otherwise.
 */
export function showNotification(title: string, options: NotificationOptions) {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, options);
      } catch (e) {
        console.warn('Notification API error:', e);
      }
      // Fallback: also show alert for visibility
      //window.alert(`${title}\n${options.body ?? ''}`);
      return true;
    } else {
      console.log('Notification not sent. Permission not granted.');
    }
  } else {
    console.log('Notification API not available.');
  }
  // Always fallback to alert if notification not shown
  //window.alert(`${title}\n${options.body ?? ''}`);
  return false;
}

/**
 * Request notification permission from the user.
 */
export function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}
