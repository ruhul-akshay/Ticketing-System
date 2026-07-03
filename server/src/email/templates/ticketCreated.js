/* ─────────────────────────────────────────────────────────────
   TICKET CREATED — email notification
   Sent to the submitter immediately after a new ticket is raised.
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

/* ── Blue hero accent ─────────────────────────────────────────── */
const BLUE_ACCENT = {
  bg         : 'linear-gradient(135deg,#eff6ff,#dbeafe)',
  border     : '#93c5fd',
  labelColor : '#1d4ed8',
};

/* ── Main exported function ───────────────────────────────────── */
/**
 * Send a "Ticket Created" notification email.
 *
 * @param {string}      to      Primary recipient e-mail address
 * @param {object}      ticket  Ticket document (populated)
 * @param {string|null} cc      Optional CC address
 */
export const sendTicketCreatedEmail = async (to, ticket, cc = null) => {
  if (!to) return;

  /* ── Derived values ──────────────────────────────────────────── */
  const submittedAt      = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
  const dateStr          = submittedAt.toLocaleDateString('en-GB', {
    day  : '2-digit',
    month: 'long',
    year : 'numeric',
  });
  const timeStr          = submittedAt.toLocaleTimeString('en-US', {
    hour  : '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const attachmentCount  =
    (ticket.attachments?.length        || 0) +
    (ticket.supportingDocuments?.length || 0);

  const submittedByName  = ticket.createdBy?.name  || '—';
  const submittedByEmail = ticket.createdBy?.email || '';
  const submittedBy      = submittedByEmail
    ? `${submittedByName} &lt;${submittedByEmail}&gt;`
    : submittedByName;

  const clientName          = ticket.createdBy?.client?.name
    || ticket.createdBy?.clientName
    || null;

  const clientContactPerson = ticket.createdBy?.client?.contactPerson || null;

  /* ── Hero card ───────────────────────────────────────────────── */
  const hero = heroCard({
    label        : 'SUPPORT REQUEST REGISTERED',
    ticketNumber : ticket.ticketNumber,
    accent       : BLUE_ACCENT,
    rightContent : `
      <div style="display:inline-block;margin-bottom:6px;">
        ${priorityBadge(ticket.priority || 'medium')}
      </div>
      <br/>
      <div style="display:inline-block;margin-top:4px;">
        ${statusBadge(ticket.status || 'pending')}
      </div>
    `,
  });

  /* ── Detail table rows ───────────────────────────────────────── */
  const rows = [
    infoRow('Subject',      ticket.title       || ticket.subject || '—'),
    infoRow('Department',   ticket.department  || '—'),
    infoRow('Category',     ticket.category    || '—'),
    infoRow('Priority',     priorityBadge(ticket.priority || 'medium')),
    infoRow('Status',       'Open / Pending'),
    ...(ticket.reason
      ? [infoRow('Reason', ticket.reason)]
      : []),
    ...(clientName
      ? [infoRow('Client', clientName)]
      : []),
    infoRow('Submitted By', submittedBy),
    infoRow('Date',         dateStr),
    infoRow('Time',         timeStr),
    infoRow('Attachments',  `${attachmentCount} file${attachmentCount !== 1 ? 's' : ''}`, true),
  ].join('');

  const table = detailTable(rows);

  /* ── Description block ───────────────────────────────────────── */
  const description = descriptionBlock(
    'Issue Description',
    ticket.description || ticket.message || '—',
  );

  /* ── "What Happens Next?" alert ──────────────────────────────── */
  const nextStepsHtml = `
    <strong style="font-size:13px;display:block;margin-bottom:8px;">
      📋&nbsp; What Happens Next?
    </strong>
    <ul style="margin:0;padding-left:18px;line-height:1.85;">
      <li>Our technical support team will review your request shortly.</li>
      <li>You will receive email updates as your ticket progresses.</li>
      <li>You can log in at any time to add comments or attach additional files.</li>
    </ul>
  `;
  const nextStepsAlert = alertBox('success', nextStepsHtml);

  /* ── CTA button ──────────────────────────────────────────────── */
  const cta = ctaButton(getClientUrl(), '🎫\u2002 Track Your Ticket Status', 'blue');

  /* ── Sign-off ────────────────────────────────────────────────── */
  const accountManagerExtra = clientContactPerson
    ? `Your Account Manager: ${clientContactPerson}`
    : '';

  const sign = signOff(
    'Akshay Support Team',
    'Akshay Software Technologies Pvt. Ltd.',
    accountManagerExtra,
  );

  /* ── Compose body ────────────────────────────────────────────── */
  const body = `
    <p style="font-size:15px;color:#334155;margin:0 0 24px 0;line-height:1.6;">
      Your support request has been successfully registered. Our team will
      get back to you as soon as possible. Please keep this email for your
      records.
    </p>

    ${hero}
    ${table}
    ${description}
    ${nextStepsAlert}
    ${cta}
    ${sign}
  `;

  const html    = emailWrapper(body);
  const subject = `[Ticket: ${ticket.ticketNumber}] ${ticket.title || ticket.subject} — Support Request Registered`;

  /* ── Send ────────────────────────────────────────────────────── */
  try {
    await sendMail({
      to,
      ...(cc ? { cc } : {}),
      subject,
      html,
      eventType: 'ticket_created'
    });
    console.log(`✅ TICKET CREATED EMAIL SENT TO: ${to}`);
  } catch (error) {
    console.error('❌ TICKET CREATED EMAIL FAILED:', error);
  }
};
