/* ─────────────────────────────────────────────────────────────
   EMAIL COMPONENTS  — reusable HTML building blocks
   ───────────────────────────────────────────────────────────── */

/* ── Priority Badge ──────────────────────────────────────────── */
export const priorityBadge = (priority = 'medium') => {
  const p = (priority || 'medium').toLowerCase();
  const map = {
    critical : { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5', dot: '#ef4444' },
    high     : { bg: '#fff7ed', color: '#9a3412', border: '#fdba74', dot: '#f97316' },
    medium   : { bg: '#fefce8', color: '#854d0e', border: '#fde047', dot: '#eab308' },
    low      : { bg: '#f0fdf4', color: '#166534', border: '#86efac', dot: '#22c55e' },
  };
  const { bg, color, border, dot } = map[p] || map.medium;
  return `
    <span style="display:inline-flex;align-items:center;gap:5px;background-color:${bg};
                 color:${color};border:1px solid ${border};padding:4px 11px 4px 8px;
                 border-radius:9999px;font-size:11px;font-weight:800;letter-spacing:0.06em;
                 text-transform:uppercase;white-space:nowrap;vertical-align:middle;">
      <span style="display:inline-block;width:6px;height:6px;background:${dot};border-radius:50%;flex-shrink:0;"></span>
      ${(priority || 'Medium').toUpperCase()}
    </span>`;
};

/* ── Status Badge ────────────────────────────────────────────── */
export const statusBadge = (status = 'pending') => {
  const s = (status || 'pending').toLowerCase();
  let bg = '#eff6ff', color = '#1e40af', border = '#bfdbfe', icon = '◉';

  if (s === 'resolved') {
    bg = '#ecfdf5'; color = '#065f46'; border = '#6ee7b7'; icon = '✓';
  } else if (s === 'hold' || s === 'on hold') {
    bg = '#fffbeb'; color = '#92400e'; border = '#fde68a'; icon = '⏸';
  } else if (s === 'cancelled' || s === 'closed') {
    bg = '#f8fafc'; color = '#475569'; border = '#cbd5e1'; icon = '✕';
  }

  return `
    <span style="display:inline-block;background-color:${bg};color:${color};
                 border:1px solid ${border};padding:4px 12px;border-radius:9999px;
                 font-size:11px;font-weight:800;letter-spacing:0.06em;
                 text-transform:uppercase;white-space:nowrap;vertical-align:middle;">
      ${icon}&nbsp;${status.replace(/_/g,' ').toUpperCase()}
    </span>`;
};

/* ── Info Table Row ──────────────────────────────────────────── */
export const infoRow = (label, value, isLast = false) => `
  <tr>
    <td style="padding:11px 16px;vertical-align:top;width:36%;
               background-color:#f8fafc;
               border-bottom:${isLast ? 'none' : '1px solid #f1f5f9'};">
      <span style="font-size:10.5px;font-weight:700;color:#64748b;
                   letter-spacing:0.07em;text-transform:uppercase;">${label}</span>
    </td>
    <td style="padding:11px 16px;vertical-align:top;
               border-bottom:${isLast ? 'none' : '1px solid #f1f5f9'};">
      <span style="font-size:13.5px;font-weight:600;color:#0f172a;line-height:1.4;">
        ${value || '—'}
      </span>
    </td>
  </tr>`;

/* ── Detail Table ────────────────────────────────────────────── */
export const detailTable = (rowsHtml) => `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="border-collapse:separate;border-spacing:0;border:1px solid #e2e8f0;
                border-radius:12px;overflow:hidden;width:100%;margin-bottom:24px;">
    <tbody>${rowsHtml}</tbody>
  </table>`;

/* ── Description Block ───────────────────────────────────────── */
export const descriptionBlock = (label, text) => `
  <p style="font-size:10.5px;font-weight:700;color:#64748b;letter-spacing:0.07em;
             text-transform:uppercase;margin:0 0 8px 0;">${label}</p>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#f8fafc;border:1px solid #e2e8f0;
                border-left:4px solid #ED1B2F;border-radius:8px;
                margin-bottom:24px;width:100%;">
    <tr>
      <td style="padding:16px 20px;font-size:14px;color:#334155;line-height:1.8;
                 white-space:pre-wrap;word-break:break-word;font-style:italic;">
        ${text || '—'}
      </td>
    </tr>
  </table>`;

/* ── Hero Card ───────────────────────────────────────────────── */
/**
 * @param {{ label, ticketNumber, accent, rightContent }} opts
 * accent: { bg, border, labelColor }
 */
export const heroCard = ({ label, ticketNumber, accent, rightContent = '' }) => `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:${accent.bg};border:1px solid ${accent.border};
                border-radius:14px;margin-bottom:24px;width:100%;overflow:hidden;">
    <tr>
      <td style="padding:22px 24px;vertical-align:middle;">
        <p style="margin:0 0 5px 0;font-size:9.5px;font-weight:800;
                  color:${accent.labelColor};letter-spacing:0.18em;text-transform:uppercase;">
          ${label}
        </p>
        <p style="margin:0;font-size:28px;font-weight:900;color:#0f172a;
                  letter-spacing:-0.03em;line-height:1.05;">
          #${ticketNumber}
        </p>
      </td>
      <td style="padding:22px 24px;text-align:right;vertical-align:middle;width:42%;">
        ${rightContent}
      </td>
    </tr>
  </table>`;

/* ── CTA Button ──────────────────────────────────────────────── */
/**
 * @param {string} url
 * @param {string} text
 * @param {'blue'|'red'|'green'|'amber'} color
 */
export const ctaButton = (url, text, color = 'blue') => {
  const themes = {
    blue  : { grad: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)', shadow: 'rgba(37,99,235,0.25)'  },
    red   : { grad: 'linear-gradient(135deg,#991b1b 0%,#ED1B2F 100%)', shadow: 'rgba(237,27,47,0.25)'  },
    green : { grad: 'linear-gradient(135deg,#14532d 0%,#16a34a 100%)', shadow: 'rgba(22,163,74,0.25)'  },
    amber : { grad: 'linear-gradient(135deg,#78350f 0%,#d97706 100%)', shadow: 'rgba(217,119,6,0.25)'  },
    purple: { grad: 'linear-gradient(135deg,#4c1d95 0%,#7c3aed 100%)', shadow: 'rgba(124,58,237,0.25)' },
  };
  const { grad, shadow } = themes[color] || themes.blue;
  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:4px 0 28px 0;">
      <tr>
        <td style="background:${grad};border-radius:10px;
                   box-shadow:0 4px 16px ${shadow};">
          <a href="${url}" target="_blank"
             style="display:inline-block;padding:13px 28px;color:#ffffff;
                    font-size:14px;font-weight:700;text-decoration:none;
                    letter-spacing:0.02em;line-height:1;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
};

/* ── Alert Box ───────────────────────────────────────────────── */
/**
 * @param {'warning'|'info'|'success'|'danger'} type
 * @param {string} html
 */
export const alertBox = (type, html) => {
  const themes = {
    warning : { bg: '#fffbeb', border: '#fde68a', accent: '#f59e0b', color: '#78350f' },
    info    : { bg: '#eff6ff', border: '#bfdbfe', accent: '#3b82f6', color: '#1e3a8a' },
    success : { bg: '#f0fdf4', border: '#bbf7d0', accent: '#22c55e', color: '#14532d' },
    danger  : { bg: '#fef2f2', border: '#fca5a5', accent: '#ef4444', color: '#7f1d1d' },
  };
  const t = themes[type] || themes.info;
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background-color:${t.bg};border:1px solid ${t.border};
                  border-left:4px solid ${t.accent};border-radius:10px;
                  margin-bottom:24px;width:100%;">
      <tr>
        <td style="padding:14px 18px;font-size:13px;color:${t.color};
                   font-weight:600;line-height:1.65;">
          ${html}
        </td>
      </tr>
    </table>`;
};

/* ── Step List ───────────────────────────────────────────────── */
/**
 * @param {string[]} steps
 */
export const stepList = (steps) => {
  const rows = steps.map((text, i) => `
    <tr>
      <td style="padding:13px 18px;vertical-align:middle;
                 border-bottom:${i < steps.length - 1 ? '1px solid #f1f5f9' : 'none'};">
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="vertical-align:middle;padding-right:12px;white-space:nowrap;">
              <span style="display:inline-block;width:22px;height:22px;
                           background:linear-gradient(135deg,#1e3a8a,#2563eb);
                           color:#ffffff;border-radius:50%;text-align:center;
                           line-height:22px;font-size:11px;font-weight:800;">
                ${i + 1}
              </span>
            </td>
            <td style="font-size:13.5px;color:#334155;line-height:1.5;">${text}</td>
          </tr>
        </table>
      </td>
    </tr>`).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="border:1px solid #e2e8f0;border-radius:12px;
                  overflow:hidden;margin-bottom:24px;width:100%;">
      <tbody>${rows}</tbody>
    </table>`;
};

/* ── Sign-off Block ──────────────────────────────────────────── */
export const signOff = (name = 'Akshay Support Team', sub = 'Akshay Software Technologies Pvt. Ltd.', extra = '') => `
  <p style="font-size:14px;color:#475569;margin:0;line-height:1.9;">
    Warm regards,<br/>
    <strong style="color:#0f172a;">${name}</strong><br/>
    <span style="font-size:12px;color:#94a3b8;">${sub}</span>
    ${extra ? `<br/><span style="font-size:12px;color:#94a3b8;">${extra}</span>` : ''}
  </p>`;

/* ── Divider ─────────────────────────────────────────────────── */
export const divider = () =>
  `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:4px 0 24px 0;">
    <tr><td style="height:1px;background-color:#f1f5f9;font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`;

/* ── Section Label ───────────────────────────────────────────── */
export const sectionLabel = (text) =>
  `<p style="font-size:10.5px;font-weight:800;color:#94a3b8;letter-spacing:0.12em;
             text-transform:uppercase;margin:0 0 10px 0;">${text}</p>`;

/* ── Message Quote Block ─────────────────────────────────────── */
export const messageQuote = (text) => `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#f8fafc;border:1px solid #e2e8f0;
                border-left:4px solid #2563eb;border-radius:8px;
                margin-bottom:24px;width:100%;">
    <tr>
      <td style="padding:16px 20px;font-size:14px;color:#1e293b;
                 line-height:1.75;font-style:italic;word-break:break-word;">
        &ldquo;${text}&rdquo;
      </td>
    </tr>
  </table>`;

/* ── Status Transition ───────────────────────────────────────── */
export const statusTransition = (oldStatus, newStatus) => `
  <table cellpadding="0" cellspacing="0" role="presentation" style="display:inline-table;">
    <tr>
      <td style="vertical-align:middle;">${statusBadge(oldStatus)}</td>
      <td style="padding:0 10px;font-size:16px;font-weight:700;color:#94a3b8;
                 vertical-align:middle;">→</td>
      <td style="vertical-align:middle;">${statusBadge(newStatus)}</td>
    </tr>
  </table>`;
