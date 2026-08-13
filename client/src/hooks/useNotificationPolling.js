import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';

const POLL_INTERVAL_MS = 10_000; // 10 seconds

/**
 * useNotificationPolling — centralises notification polling so it runs
 * exactly ONCE in MainLayout, not independently in both Sidebar and Navbar.
 *
 * The hook reads the user's soundEnabled preference and triggers a browser
 * notification sound when new unread notifications arrive.
 */
export function useNotificationPolling() {
  const { fetchNotifications, notifications } = useNotificationStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const prevUnreadCountRef = useRef(0);

  // Initial fetch + polling interval
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchNotifications().catch((err) =>
      console.error('[Notifications] Initial fetch failed:', err)
    );

    const interval = setInterval(() => {
      fetchNotifications().catch((err) =>
        console.error('[Notifications] Poll failed:', err)
      );
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  // Play a subtle sound when new unread notifications arrive
  useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    const soundEnabled = user?.preferences?.soundEnabled !== false;

    if (unreadCount > prevUnreadCountRef.current && soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5

        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } catch {
        // AudioContext may be blocked by browser policy — fail silently
      }
    }

    prevUnreadCountRef.current = unreadCount;
  }, [notifications, user?.preferences?.soundEnabled]);
}
