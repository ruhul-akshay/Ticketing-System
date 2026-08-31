import {
  priorityBadge,
  statusBadge,
  infoRow,
  detailTable,
  descriptionBlock,
  heroCard,
  ctaButton,
  signOff,
} from '../components.js';
import { emailWrapper, getClientUrl } from '../layout.js';
import { sendMail } from '../transporter.js';

/* ─────────────────────────────────────────────────────────────
   TICKET ASSIGNED → CONSULTANT
   Sent when a ticket is assigned to a consultant by an admin
   or super admin.
   ───────────────────────────────────────────────────────────── */

/**
 * @param {string}      to          Recipient email address (consultant)
 * @param {object}      ticket      Ticket document
 * @param {object}      assignedBy  User who performed the assignment
 * @param {object}      assignedTo  Consultant who receives the ticket
 * @param {string}      [remarks]   Optional assignment notes / remarks
 * @param {string|null} [cc]        Optional CC address(es)
 */
export const sendTicketAssignedConsultantEmail = async (
  to,
  ticket,
  assignedBy,
  assignedTo,
  remarks = '',
  cc = null,
) => {
  if (!to) return;

  /* ── Derived values ────────────────────────────────────────── */
  const consultantName = assignedTo?.name || 'Consultant';
  const assignerName   = assignedBy?.name || 'Super Admin';
  const clientName     =
    ticket.createdBy?.client?.name ||
    ticket.createdBy?.clientName   ||
    null;

  const submittedBy = ticket.createdBy
    ? `${ticket.createdBy.name || '—'}${ticket.createdBy.email ? ` &lt;${ticket.createdBy.email}&gt;` : ''}`
    : '—';

  /* ── Detail table rows ─────────────────────────────────────── */
  const rows = [
    infoRow('Subject',      ticket.title),
    infoRow('Department',   ticket.department?.name || ticket.department || '—'),
    infoRow('Priority',     priorityBadge(ticket.priority)),
    infoRow('Submitted By', submittedBy),
    ...(clientName ? [infoRow('Client', clientName)] : []),
    infoRow('Status', statusBadge(ticket.status || 'assigned'), true /* isLast */),
  ].join('');

  /* ── Email body ────────────────────────────────────────────── */
  const body = `
    <p style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 12px 0;">
      Hello <strong>${consultantName}</strong>,
    </p>
    <p style="font-size:14px;color:#475569;margin:0 0 24px 0;line-height:1.7;">
      A support ticket has been assigned to you by
      <strong style="color:#0f172a;">${assignerName}</strong>.
      Please review the details below and take the necessary action at your earliest convenience.
    </p>

    ${heroCard({
      label        : 'ASSIGNED TO YOU',
      ticketNumber : ticket.ticketNumber,
      accent       : {
        bg         : 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
        border     : '#c4b5fd',
        labelColor : '#6d28d9',
      },
      rightContent : priorityBadge(ticket.priority),
    })}

    ${remarks ? descriptionBlock('Assignment Notes / Remarks', remarks) : ''}

    ${detailTable(rows)}

    ${descriptionBlock('Issue Description', ticket.description)}

    ${/* FIX: was '/consultant/tickets/${ticket._id}' — route may 404; use portal root */
      ctaButton(getClientUrl(), '🔧  Open in Consultant Panel', 'red')}

    ${signOff('Akshay Support System', 'Akshay Software Technologies Pvt. Ltd.')}
  `;

  const html = emailWrapper(body);

  // FIX: added try/catch — previously an SMTP failure would propagate uncaught
  try {
    await sendMail({
      to,
      cc,
      subject  : `🚨 Assigned Ticket [${ticket.ticketNumber}] — Assigned to You | ${ticket.title}`,
      html,
      eventType: 'ticket_assigned',
    });
    console.log(`✅ TICKET ASSIGNED (CONSULTANT) EMAIL SENT TO: ${to}`);
  } catch (err) {
    console.error('❌ TICKET ASSIGNED EMAIL FAILED:', err.message || err);
  }
};
