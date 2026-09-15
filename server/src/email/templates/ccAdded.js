import {
  priorityBadge,
  statusBadge,
  infoRow,
  detailTable,
  heroCard,
  ctaButton,
  alertBox,
  signOff,
} from '../components.js';
import { emailWrapper, getClientUrl } from '../layout.js';
import { sendMail } from '../transporter.js';

/* ─────────────────────────────────────────────────────────────
   CC ADDED NOTIFICATION EMAIL
   Sent to each newly added CC recipient on an existing ticket
   so they are aware of the ticket and can follow up.
   ───────────────────────────────────────────────────────────── */

const TEAL_ACCENT = {
  bg         : 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
  border     : '#6ee7b7',
  labelColor : '#059669',
};

/**
 * Send a "You have been added to a ticket" notification to one or
 * more newly added CC recipients.
 *
 * @param {string|string[]} to       Single email or array of emails to notify
 * @param {object}          ticket   Populated ticket document
 * @param {object}          addedBy  The consultant/user who added the CCs (name, role)
 */
export const sendCcAddedNotificationEmail = async (to, ticket, addedBy) => {
  if (!to) return;

  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!recipients.length) return;

  const adderName = addedBy?.name || 'A support consultant';
  const adderRole = addedBy?.role === 'superadmin'
    ? 'Super Admin'
    : addedBy?.role === 'consultant'
      ? 'Consultant'
      : 'Support Staff';

  const submittedAt  = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
  const dateStr      = submittedAt.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'
  });

  const hero = heroCard({
    label        : 'YOU\'VE BEEN ADDED TO A SUPPORT TICKET',
    ticketNumber : ticket.ticketNumber,
    accent       : TEAL_ACCENT,
    rightContent : `
      <div style="display:inline-block;margin-bottom:6px;">
        ${priorityBadge(ticket.priority || 'medium')}
      </div>
      <br/>
      <div style="display:inline-block;margin-top:4px;">
        ${statusBadge(ticket.status || 'open')}
      </div>
    `,
  });

  const rows = [
    infoRow('Ticket No.',   `#${ticket.ticketNumber}`),
    infoRow('Subject',      ticket.title || ticket.subject || '—'),
    infoRow('Priority',     priorityBadge(ticket.priority || 'medium')),
    infoRow('Status',       statusBadge(ticket.status || 'open')),
    infoRow('Department',   ticket.department?.name || ticket.department || '—'),
    infoRow('Logged On',    dateStr),
    infoRow('Raised By',    ticket.createdBy?.name || '—'),
    infoRow('Added By',     `${adderName} (${adderRole})`, true),
  ].join('');

  const noticeHtml = `
    <strong style="font-size:13px;display:block;margin-bottom:8px;">
      📋&nbsp; Why am I receiving this?
    </strong>
    <p style="margin:0;line-height:1.8;font-size:13px;">
      <strong>${adderName}</strong> (${adderRole}) has added you as a CC recipient on this
      support ticket. You will now receive email updates whenever there is activity on this
      ticket — including status changes and new messages. No action is required from you
      unless you wish to follow up directly with the support team.
    </p>
  `;

  const body = `
    <p style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 12px 0;">Hello,</p>
    <p style="font-size:14px;color:#475569;margin:0 0 24px 0;line-height:1.7;">
      You have been added as a <strong>CC recipient</strong> on the following support ticket.
      You will be kept in the loop on all updates related to this request.
    </p>

    ${hero}
    ${detailTable(rows)}
    ${alertBox('success', noticeHtml)}
    ${ctaButton(getClientUrl(), '🎫\u2002 View Ticket Portal', 'blue')}
    ${signOff('Akshay Support Team', 'Akshay Software Technologies Pvt. Ltd.')}
  `;

  const html    = emailWrapper(body);
  const subject = `[CC] Ticket #${ticket.ticketNumber}: ${ticket.title || ticket.subject} — You've been added as a recipient`;

  // Send one email with all new CC recipients in the To field (or iterate individually)
  for (const email of recipients) {
    try {
      await sendMail({
        to      : email,
        subject,
        html,
        eventType: 'cc_added',
      });
      console.log(`✅ CC ADDED NOTIFICATION EMAIL SENT TO: ${email}`);
    } catch (err) {
      console.error(`❌ CC ADDED NOTIFICATION EMAIL FAILED for ${email}:`, err.message || err);
    }
  }
};
