import {
  priorityBadge,
  statusBadge,
  infoRow,
  detailTable,
  heroCard,
  ctaButton,
  signOff,
  statusTransition,
} from '../components.js';
import { emailWrapper, getClientUrl } from '../layout.js';
import { sendMail } from '../transporter.js';

/* ─────────────────────────────────────────────────────────────
   TICKET STATUS UPDATED EMAIL
   Sent to the ticket creator (and optionally the assigned
   consultant) whenever the ticket's status changes.
   ───────────────────────────────────────────────────────────── */

export const sendTicketStatusUpdatedEmail = async (to, cc, ticket, oldStatus, newStatus, updatedBy) => {
  if (!to) return;

  // Guard: skip if there is no actual change
  if (oldStatus === newStatus) return;

  const formatStatus = (s) => {
    if (!s) return 'Open';
    const lower = s.toLowerCase();
    if (lower === 'pending' || lower === 'assigned') return 'Open';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const formattedOld  = formatStatus(oldStatus);
  const formattedNew  = formatStatus(newStatus);
  const updaterName   = updatedBy?.name || 'Support Staff';
  const updaterRole   = updatedBy?.role === 'superadmin'
    ? 'Super Admin'
    : updatedBy?.role === 'consultant'
      ? 'Consultant'
      : 'User';

  // FIX: was ticket.subject (field does not exist) — use ticket.title
  const ticketTitle = ticket.title || ticket.subject || '—';

  const recipientName = ticket.createdBy?.name || null;

  const body = `
    <p style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 12px 0;">
      Hello${recipientName ? `, <strong>${recipientName}</strong>` : ''},
    </p>
    <p style="font-size:14px;color:#475569;margin:0 0 24px 0;line-height:1.7;">
      The status of ticket <strong>#${ticket.ticketNumber}</strong> has been updated by
      <strong>${updaterName}</strong> (${updaterRole}).
    </p>

    ${heroCard({
      label        : 'STATUS UPDATE',
      ticketNumber : ticket.ticketNumber,
      accent       : {
        bg         : 'linear-gradient(135deg,#f8fafc,#f1f5f9)',
        border     : '#cbd5e1',
        labelColor : '#475569',
      },
      rightContent : statusTransition(formattedOld, formattedNew),
    })}

    ${detailTable([
      infoRow('Subject',         ticketTitle),
      infoRow('Previous Status', formattedOld),
      infoRow('New Status',      statusBadge(formattedNew)),
      infoRow('Updated By',      `${updaterName} (${updaterRole})`),
      infoRow('Priority',        priorityBadge(ticket.priority), true),
    ].join(''))}

    ${ctaButton(getClientUrl(), '🔗  Track Your Ticket', 'blue')}

    ${signOff()}
  `;

  const html = emailWrapper(body);

  try {
    await sendMail({
      to,
      cc,
      subject : `[Status Update] Ticket ${ticket.ticketNumber} → ${formattedNew}`,
      html,
      eventType: 'ticket_status_updated',
    });
    console.log(`✅ TICKET STATUS UPDATED EMAIL SENT TO: ${to}`);
  } catch (err) {
    console.error('❌ TICKET STATUS UPDATED EMAIL FAILED:', err.message || err);
  }
};
