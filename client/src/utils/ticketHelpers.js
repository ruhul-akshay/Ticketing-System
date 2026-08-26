/**
 * ticketHelpers.js
 * Centralized ticket badge, color, status, and CSV parsing helpers.
 */

/**
 * Returns Tailwind class string for priority badge
 * @param {string} priority 
 * @returns {string}
 */
export const getPriorityBadgeClass = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
    case 'critical':
      return 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20';
    case 'low':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    default:
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
  }
};

/**
 * Returns primary color name for priority
 * @param {string} priority 
 * @returns {'red'|'yellow'|'blue'|'green'|'gray'}
 */
export const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
    case 'critical':
      return 'red';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'blue';
    default:
      return 'gray';
  }
};

/**
 * Returns Tailwind class string for ticket status badge
 * @param {string} status 
 * @returns {string}
 */
export const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'resolved':
    case 'closed':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    case 'on hold':
    case 'hold':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20';
    case 'cancelled':
      return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20';
    case 'open':
    case 'pending':
    case 'assigned':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    default:
      return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20';
  }
};

/**
 * Returns primary color name for status
 * @param {string} status 
 * @returns {'emerald'|'yellow'|'red'|'blue'|'gray'|'green'}
 */
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'green';
    case 'resolved':
    case 'closed':
      return 'emerald';
    case 'pending':
    case 'on hold':
    case 'hold':
      return 'yellow';
    case 'open':
    case 'suspended':
      return 'red';
    case 'cancelled':
    default:
      return 'gray';
  }
};

/**
 * Checks whether a ticket has NOT been opened by the given user yet
 * @param {Object} ticket 
 * @param {Object} user 
 * @returns {boolean}
 */
export const isUnopened = (ticket, user) => {
  if (!user || !ticket) return false;
  const openedByList = (ticket.openedBy || ticket.original?.openedBy || []).map(id => String(id));
  const userId = String(user.id || user._id || '');
  return userId ? !openedByList.includes(userId) : false;
};

/**
 * Returns the latest relevant date timestamp (in ms) for a ticket.
 * Considers forward date, assign date, updatedAt, and createdAt.
 * @param {Object} ticket 
 * @returns {number}
 */
export const getTicketEffectiveDate = (ticket) => {
  if (!ticket) return 0;
  let maxTime = new Date(ticket.createdAt || 0).getTime();

  // Check updatedAt
  if (ticket.updatedAt || ticket.original?.updatedAt) {
    const uTime = new Date(ticket.updatedAt || ticket.original?.updatedAt).getTime();
    if (uTime > maxTime) maxTime = uTime;
  }

  // Check assignment and forward history
  const history = ticket.assignmentHistory || ticket.original?.assignmentHistory || [];
  if (Array.isArray(history)) {
    for (const h of history) {
      if (h.actionDate) {
        const aTime = new Date(h.actionDate).getTime();
        if (aTime > maxTime) maxTime = aTime;
      }
    }
  }

  return maxTime;
};

/**
 * Robust CSV parser supporting quoted cells and multiline fields
 * @param {string} text 
 * @returns {Array<Array<string>>}
 */
export const parseCSV = (text) => {
  if (!text) return [];
  const lines = [];
  let row = [""];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
};
