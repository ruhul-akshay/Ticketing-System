import {
  priorityBadge,
  infoRow,
  detailTable,
  descriptionBlock,
  heroCard,
  ctaButton,
  signOff,
} from '../components.js';
import { emailWrapper, getClientUrl } from '../layout.js';
import { sendMail }                   from '../transporter.js';

import ConsultantProfile from '../../models/ConsultantProfile.js';
import ClientUser        from '../../models/ClientUser.js';

/* ─────────────────────────────────────────────────────────────
   CONSULTANT ALERT EMAIL
   Fires when a new ticket is created — notifies every consultant
   in the ticket's department PLUS all active super-admins.
   ───────────────────────────────────────────────────────────── */

export const sendConsultantTicketAlertEmail = async (ticket) => {
  /* ── Guards ─────────────────────────────────────────────────── */
  if (!ticket?.department) return;

  try {
    /* ── 1. Gather consultants for the ticket's department ──────── */
    const consultants = await ConsultantProfile.find({
      department: ticket.department._id || ticket.department,
    }).populate('user', 'name email role');

    const consultantEmails = consultants
      .map((c) => c.user?.email)
      .filter(Boolean);

    /* ── 2. Gather active super-admins ─────────────────────────── */
    const superAdmins = await ClientUser.find({
      role  : 'superadmin',
      status: 'active',
    });

    const superAdminEmails = superAdmins
      .map((u) => u.email)
      .filter(Boolean);

    /* ── 3. Merge into a unique recipient list ─────────────────── */
    const recipients = [...new Set([...consultantEmails, ...superAdminEmails])];
    if (recipients.length === 0) return;

    /* ── 4. Format date and text fields ────────────────────────── */
    const submittedAt = ticket.submittedAt ? new Date(ticket.submittedAt) : new Date();
    const formattedDate = submittedAt.toLocaleDateString('en-GB', {
      day  : '2-digit',
      month: 'long',
      year : 'numeric',
    });

    const clientName =
      ticket.createdBy?.client?.name ||
      ticket.createdBy?.clientName ||
      null;

    const submittedBy = ticket.createdBy
      ? `${ticket.createdBy.name || 'Unknown'} <${ticket.createdBy.email || ''}>`
      : 'Unknown';

    /* ── 5. Build HTML content ──────────────────────────────────── */
    const redAccent = {
      bg        : 'linear-gradient(135deg,#fef2f2,#fee2e2)',
      border    : '#fca5a5',
      labelColor: '#dc2626',
    };

    const rows = [
      infoRow('Subject', ticket.title || 'No Subject'),
      infoRow('Department', ticket.department?.name || 'Support'),
      infoRow('Priority', priorityBadge(ticket.priority)),
      infoRow('Submitted By', submittedBy),
    ];

    if (clientName) {
      rows.push(infoRow('Client', clientName));
    }

    rows.push(infoRow('Date', formattedDate, true));

    const body = `
      <p style="font-size:14px;color:#475569;margin:0 0 24px 0;line-height:1.7;">
        A new support ticket has been submitted in your department and requires attention.
        Please review the details below and respond at your earliest convenience.
      </p>

      ${heroCard({
        label       : 'NEW TICKET — DEPT ALERT',
        ticketNumber: ticket.ticketNumber,
        accent      : redAccent,
        rightContent: priorityBadge(ticket.priority),
      })}

      ${detailTable(rows)}

      ${ticket.description
        ? descriptionBlock('Issue Details', ticket.description)
        : ''
      }

      ${ctaButton(getClientUrl(), '🔧  Open in Consultant Panel', 'red')}

      ${signOff('Akshay Support System')}
    `;

    const html = emailWrapper(body);

    /* ── 6. Subject line ─────────────────────────────────────────── */
    const subject =
      `🚨 New Ticket [${ticket.ticketNumber}] — ` +
      `${(ticket.priority || 'medium').toUpperCase()} Priority | ` +
      `${ticket.department?.name || 'Support'}`;

    /* ── 7. Send ─────────────────────────────────────────────────── */
    await sendMail({ to: recipients, subject, html, eventType: 'ticket_created' });

    console.log(`✅ CONSULTANT ALERT EMAIL SENT TO: ${recipients.join(', ')}`);
  } catch (err) {
    console.error('❌ CONSULTANT ALERT EMAIL ERROR:', err.message || err);
  }
};
