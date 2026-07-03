import { priorityBadge, statusBadge, infoRow, detailTable, heroCard, ctaButton, signOff, statusTransition } from '../components.js';
import { emailWrapper, getClientUrl } from '../layout.js';
import { sendMail } from '../transporter.js';

export const sendTicketStatusUpdatedEmail = async (to, cc, ticket, oldStatus, newStatus, updatedBy) => {
  if (!to) return;

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

  const body = `
    <p style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 12px 0;">Hello,</p>
    <p style="font-size:14px;color:#475569;margin:0 0 24px 0;line-height:1.7;">
      The status of ticket <strong>#${ticket.ticketNumber}</strong> has been updated by
      <strong>${updaterName}</strong>.
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
      infoRow('Subject',         ticket.subject),
      infoRow('Previous Status', formattedOld),
      infoRow('New Status',      statusBadge(formattedNew)),
      infoRow('Updated By',      `${updaterName} (${updaterRole})`),
      infoRow('Priority',        priorityBadge(ticket.priority), true),
    ].join(''))}

    ${ctaButton(`${getClientUrl()}`, '🔗  Track Your Ticket', 'blue')}

    ${signOff()}
  `;

  const html = emailWrapper(body);

  await sendMail({
    to,
    cc,
    subject : `[Status Update] Ticket ${ticket.ticketNumber} → ${formattedNew}`,
    html,
    eventType: 'ticket_status_updated'
  });

  console.log(`✅ TICKET STATUS UPDATED EMAIL SENT TO: ${to}`);
};
