/**
 * formatters.js
 * Centralized formatting utilities with defensive error handling.
 */

/**
 * Format total hours as "X hours and Y minutes", "X hours", or "Y minutes"
 * @param {number|string} hoursVal 
 * @returns {string}
 */
export const formatHoursToHM = (hoursVal) => {
  if (hoursVal === null || hoursVal === undefined || isNaN(Number(hoursVal))) {
    return '0 hours';
  }
  const totalMinutes = Math.round(Number(hoursVal || 0) * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs > 0 && mins > 0) {
    return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} and ${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
  }
  if (hrs > 0) {
    return `${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
  }
  if (mins > 0) {
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
  }
  return '0 hours';
};

/**
 * Format minutes as "Xh Ym", "Xh", or "Ym"
 * @param {number|string} minutes 
 * @returns {string}
 */
export const formatMinutesToHM = (minutes) => {
  if (!minutes || isNaN(Number(minutes)) || Number(minutes) <= 0) return '0m';
  const num = Number(minutes);
  if (num < 60) return `${Math.round(num)}m`;
  const hours = Math.floor(num / 60);
  const mins = Math.round(num % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Format date into locale date string: "DD MMM YYYY" (e.g. 15 Aug 2024)
 * @param {string|Date|number} date 
 * @returns {string}
 */
export const formatDateOnly = (date) => {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    console.error('Error formatting date:', e);
    return '—';
  }
};

/**
 * Format date & time into readable string: "DD/MM/YYYY, HH:MM" or similar
 * @param {string|Date|number} date 
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error('Error formatting datetime:', e);
    return '—';
  }
};

/**
 * Format relative time (e.g., "5m ago", "2h ago", "3d ago")
 * @param {string|Date|number} date 
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
  if (!date) return '—';
  try {
    const now = new Date();
    const target = new Date(date);
    if (isNaN(target.getTime())) return '—';
    
    const diff = now - target;
    if (diff < 0) return 'Just now';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return formatDateOnly(date);
  } catch (e) {
    console.error('Error formatting relative time:', e);
    return '—';
  }
};

/**
 * Format file size in bytes to human-readable string (KB / MB)
 * @param {number} bytes 
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (!bytes || isNaN(Number(bytes)) || Number(bytes) <= 0) return '0 KB';
  const kb = Number(bytes) / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};
