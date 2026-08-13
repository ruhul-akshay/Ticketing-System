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

/* ─────────────────────────────────────────────────────────────
   TICKET FORWARDED → CONSULTANT
   Sent to the consultant who has been assigned a forwarded ticket.
   ───────────────────────────────────────────────────────────── */

/**
 * @param {string}      to            Consultant's email address
 * @param {object}      ticket        Ticket document
 * @param {object}      forwardedBy   Staff member who forwarded the ticket
 * @param {object}      forwardedTo   Consultant the ticket was forwarded to
 * @param {string}      [remarks='']  Optional transfer notes / remarks
 * @param {string|null} [cc=null]     Optional CC address(es)
 */
export const sendTicketForwardedConsultantEmail = async (
  to,
  ticket,
  forwardedBy,
  forwardedTo,
  remarks = '',
  cc = null,
) => {
  if (!to) return;

  /* ── Derived values ─────────────────────────────────────── */
  const consultantName = forwardedTo?.name || 'Consultant';
  const forwarderName  = forwardedBy?.name || 'a team member';
  const clientName =
    ticket.createdBy?.client?.name ||
    ticket.createdBy?.clientName   ||
    null;

  const submittedBy = ticket.createdBy
    ? ticket.createdBy.email
      ? `${ticket.createdBy.name} &lt;${ticket.createdBy.email}&gt;`
      : ticket.createdBy.name || '—'
    : '—';

  /* ── Detail table rows ──────────────────────────────────── */
  const rows = [
    infoRow('Subject',      ticket.title     || '—'),
    infoRow('Department',   ticket.department?.name || ticket.department || '—'),
    infoRow('Priority',     priorityBadge(ticket.priority)),
    infoRow('Submitted By', submittedBy),
    ...(clientName ? [infoRow('Client', clientName)] : []),
    infoRow('Status', statusBadge(ticket.status || 'assigned'), /* isLast */ true),
  ].join('');

  /* ── Email body ─────────────────────────────────────────── */
  const body = `
    <p style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 12px 0;">
      Hello <strong>${consultantName}</strong>,
    </p>
    <p style="font-size:14px;color:#475569;margin:0 0 24px 0;line-height:1.7;">
      A support ticket has been forwarded and assigned to you by
      <strong style="color:#0f172a;">${forwarderName}</strong>.
      Please review the details below and take the necessary action at your earliest convenience.
    </p>

    ${heroCard({
      label        : 'FORWARDED TO YOU',
      ticketNumber : ticket.ticketNumber,
      accent       : {
        bg         : 'linear-gradient(135deg,#fffbeb,#fef3c7)',
        border     : '#fde68a',
        labelColor : '#b45309',
      },
      rightContent : priorityBadge(ticket.priority),
    })}

    ${remarks ? descriptionBlock('Transfer Notes / Remarks', remarks) : ''}

    ${detailTable(rows)}

    ${descriptionBlock('Issue Description', ticket.description)}

    ${ctaButton(
      `${getClientUrl()}/consultant/tickets/${ticket._id || ticket.ticketNumber}`,
      '🔧  Open in Consultant Panel',
      'red',
    )}

    ${signOff('Akshay Support System', 'Akshay Software Technologies Pvt. Ltd.')}
  `;

  const html = emailWrapper(body);

  await sendMail({
    to,
    cc,
    subject : `🚨 Forwarded Ticket [${ticket.ticketNumber}] — Assigned to You | ${ticket.title}`,
    html,
    eventType: 'ticket_assigned'
  });

  console.log(`✅ TICKET FORWARDED (CONSULTANT) EMAIL SENT → ${to}`);
};
