import { priorityBadge, statusBadge, infoRow, detailTable, descriptionBlock, heroCard, ctaButton, alertBox, signOff } from '../components.js';
import { emailWrapper, getClientUrl } from '../layout.js';
import { sendMail } from '../transporter.js';

/* -----------------------------------------------------------------
   TICKET FORWARDED -- User / Ticket Creator Notification
   Notifies the ticket creator that their ticket has been
   forwarded to a specialist for further attention.
   ----------------------------------------------------------------- */

export const sendTicketForwardedUserEmail = async (to, ticket, forwardedBy, forwardedTo, remarks = '', cc = null) => {
  if (!to) return;

  /* -- Accent theme: green (forwarding / positive action) -- */
  const accent = {
    bg         : 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
    border     : '#86efac',
    labelColor : '#15803d',
  };

  /* -- Forwarding update card (custom left-cell content) -- */
  const forwardingCard = `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background:${accent.bg};border:1px solid ${accent.border};
                  border-radius:14px;margin-bottom:24px;width:100%;overflow:hidden;">
      <tr>
        <td style="padding:22px 24px;vertical-align:middle;">
          <p style="margin:0 0 5px 0;font-size:9.5px;font-weight:800;
                    color:${accent.labelColor};letter-spacing:0.18em;text-transform:uppercase;">
            FORWARDING UPDATE
          </p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">Assigned To: ${forwardedTo?.name || 'Support Specialist'}</p>
          <p style="margin:6px 0 0 0;font-size:12px;color:#475569;">Forwarded By: ${forwardedBy?.name || 'System'}</p>
        </td>
        <td style="padding:22px 24px;text-align:right;vertical-align:middle;width:42%;">
          ${priorityBadge(ticket.priority)}
        </td>
      </tr>
    </table>`;

  /* -- Email body -- */
  const body = `
    <p style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 12px 0;">Hello <strong>${ticket.createdBy?.name || ticket.userName || 'Valued Customer'}</strong>,</p>
    <p style="font-size:14px;color:#475569;margin:0 0 24px 0;line-height:1.7;">
      We wanted to let you know that your support ticket has been reviewed and forwarded to a specialist
      who is best equipped to resolve your issue. Your request is in good hands and will be attended to promptly.
    </p>

    ${forwardingCard}

    ${remarks ? descriptionBlock('Transfer Notes / Remarks', remarks) : ''}

    ${detailTable([
      infoRow('Ticket No.', ticket.ticketNumber),
      infoRow('Subject',    ticket.title),
      infoRow('Department', ticket.department || ticket.departmentName || '-'),
      infoRow('Status',     statusBadge(ticket.status || 'assigned'), true),
    ].join(''))}

    ${ctaButton(`${getClientUrl()}/tickets/${ticket._id || ticket.ticketNumber}`, '🔗  View Ticket Status', 'blue')}

    ${signOff()}
  `;

  const html = emailWrapper(body);

  await sendMail({
    to,
    cc,
    subject : `[Forwarded] Ticket ${ticket.ticketNumber}: ${ticket.title} — Reassigned to Specialist`,
    html,
    eventType: 'ticket_assigned'
  });

  console.log(`✅ FORWARDED USER EMAIL SENT TO: ${to}`);
};
