/* ─────────────────────────────────────────────────────────────
   TICKET RESOLVED EMAIL
   Sent to the customer when their support ticket is marked
   as resolved.
   ───────────────────────────────────────────────────────────── */

import {
  priorityBadge,
  statusBadge,
  infoRow,
  detailTable,
  descriptionBlock,
  heroCard,
  ctaButton,
  alertBox,
  signOff,
} from '../components.js';
import { emailWrapper, getClientUrl } from '../layout.js';
import { sendMail } from '../transporter.js';

/* ── Public export ───────────────────────────────────────────── */

/**
 * Send a "Ticket Resolved" notification email.
 *
 * @param {string} to      Recipient e-mail address.
 * @param {object} ticket  Mongoose ticket document (plain or lean).
 */
export const sendTicketResolvedEmail = async (to, ticket) => {
  if (!to) return;

  const resolvedAt    = new Date(ticket.solvedAt || ticket.actualResolutionDate || Date.now());
  const formattedDate = resolvedAt.toLocaleDateString('en-GB', {
    day   : '2-digit',
    month : 'long',
    year  : 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const resolvedBy = ticket.solvedBy?.name || 'Support Team';
  const reviewUrl  = getClientUrl() + '/reviews';

  /* ── Hero card – green accent with large ✓ RESOLVED badge ── */
  const hero = heroCard({
    label        : 'TICKET RESOLVED',
    ticketNumber : ticket.ticketNumber,
    accent       : {
      bg         : 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
      border     : '#86efac',
      labelColor : '#15803d',
    },
    rightContent : statusBadge('resolved'),
  });

  /* ── Detail table: Subject · Resolved On · Resolved By ───── */
  const table = detailTable(
    infoRow('Subject',     ticket.title)        +
    infoRow('Resolved On', formattedDate)        +
    infoRow('Resolved By', resolvedBy, true),
  );

  /* ── Optional resolution summary ────────────────────────────*/
  const resolution = ticket.solution
    ? descriptionBlock('Resolution Summary', ticket.solution)
    : '';

  /* ── Success notice ─────────────────────────────────────────*/
  const notice = alertBox(
    'success',
    'Thank you for your patience. We hope your issue has been fully resolved. ' +
    'Please don\u2019t hesitate to raise a new ticket if you need further assistance.',
  );

  /* ── Rating CTA button ──────────────────────────────────────*/
  const rateBtn = ctaButton(reviewUrl, '\u2B50\u2003Rate Our Service', 'amber');

  /* ── Inline "View Ticket Details" link ──────────────────────*/
  const viewLink = `<p style="margin:-16px 0 24px 0;"><a href="${getClientUrl()}" target="_blank" style="font-size:13px;font-weight:600;color:#2563eb;text-decoration:none;">View Ticket Details &rarr;</a></p>`;

  const html = emailWrapper(
    hero       +
    table      +
    resolution +
    notice     +
    rateBtn    +
    viewLink   +
    signOff(),
  );

  const subject = `[Resolved] Ticket ${ticket.ticketNumber}: ${ticket.title}`;

  // FIX: added try/catch — previously an SMTP failure would propagate uncaught
  try {
    await sendMail({ to, subject, html, eventType: 'ticket_closed' });
    console.log(`✅ TICKET RESOLVED EMAIL SENT TO: ${to}`);
  } catch (err) {
    console.error('❌ TICKET RESOLVED EMAIL FAILED:', err.message || err);
  }
};
