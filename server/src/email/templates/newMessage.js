import { priorityBadge, statusBadge, infoRow, detailTable, ctaButton, signOff, messageQuote, sectionLabel } from '../components.js';
import { emailWrapper, getClientUrl } from '../layout.js';
import { sendMail } from '../transporter.js';

export const sendNewMessageNotificationEmail = async (to, ticket, messageText, sender, recipientRole = 'clientuser') => {
  if (!to) return;

  const roleString = sender.role === 'superadmin' ? 'Super Admin'
    : sender.role === 'consultant' ? 'Consultant' : 'Customer';

  const body = `
    <p style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 12px 0;">Hello,</p>
    <p style="font-size:14px;color:#475569;margin:0 0 24px 0;line-height:1.7;">A new message has been posted on ticket <strong>#${ticket.ticketNumber}</strong> by <strong>${sender.name}</strong> (${roleString}).</p>
    ${sectionLabel('Message')}
    ${messageQuote(messageText)}
    ${detailTable([
      infoRow('Ticket No.', `#${ticket.ticketNumber}`),
      infoRow('Subject',    ticket.title),
      infoRow('Priority',   priorityBadge(ticket.priority)),
      infoRow('Status',     statusBadge(ticket.status || 'open'), true),
    ].join(''))}
    ${ctaButton(`${getClientUrl()}/tickets/${ticket._id}`, '💬  Reply to Ticket', 'blue')}
    ${signOff()}
  `;

  const html = emailWrapper(body);

  await sendMail({
    to,
    subject: `[New Message] Ticket ${ticket.ticketNumber}: ${ticket.title}`,
    html,
    eventType: 'new_message'
  });

  console.log(`✅ NEW MESSAGE NOTIFICATION EMAIL SENT TO: ${to}`);
};
