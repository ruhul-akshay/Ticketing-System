import {
  priorityBadge,
  statusBadge,
  infoRow,
  detailTable,
  descriptionBlock,
  ctaButton,
  signOff,
  sectionLabel,
} from '../components.js';
import { emailWrapper, getClientUrl } from '../layout.js';
import { sendMail } from '../transporter.js';

const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const renderConversationHistory = (remarks = [], isClientRecipient = true, currentMessageText = '') => {
  if (!Array.isArray(remarks) || remarks.length === 0) return '';

  // Filter out internal notes if recipient is a client user
  const visible = remarks.filter(r => {
    if (isClientRecipient && r.isInternal) return false;
    return true;
  });

  if (visible.length === 0) return '';

  // Exclude current message from history if it was already pushed to ticket.remarks
  let historyRemarks = visible;
  if (
    historyRemarks.length > 0 &&
    currentMessageText &&
    historyRemarks[historyRemarks.length - 1].text?.trim() === currentMessageText.trim()
  ) {
    historyRemarks = historyRemarks.slice(0, -1);
  }

  // Take up to 4 most recent prior remarks
  const recent = historyRemarks.slice(-4);
  if (recent.length === 0) return '';

  return recent.map(r => {
    const sName = r.addedBy?.name || 'Participant';
    const roleLower = (r.addedBy?.role || 'consultant').toLowerCase();
    const isCustomer = roleLower === 'clientuser';
    const roleLabel = isCustomer ? 'Customer' : (roleLower === 'superadmin' ? 'Super Admin' : 'Consultant');
    const badgeBg = isCustomer ? '#dbeafe' : '#e0e7ff';
    const badgeColor = isCustomer ? '#1e40af' : '#3730a3';
    const cardBg = isCustomer ? '#f8fafc' : '#f0fdf4';
    const cardBorder = isCustomer ? '#e2e8f0' : '#bbf7d0';
    const timeStr = r.addedAt ? new Date(r.addedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

    return `
      <div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:8px;padding:12px 14px;margin-bottom:10px;">
        <div style="margin-bottom:6px;">
          <strong style="font-size:12.5px;color:#0f172a;">${escapeHtml(sName)}</strong>
          <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;background:${badgeBg};color:${badgeColor};margin-left:6px;text-transform:uppercase;">${roleLabel}</span>
          ${r.isInternal ? '<span style="font-size:9.5px;font-weight:700;padding:2px 5px;border-radius:4px;background:#fef2f2;color:#991b1b;margin-left:4px;">INTERNAL</span>' : ''}
          ${timeStr ? `<span style="float:right;font-size:11px;color:#64748b;">${timeStr}</span>` : ''}
        </div>
        <div style="font-size:13px;color:#334155;line-height:1.6;white-space:pre-wrap;word-break:break-word;">${escapeHtml(r.text)}</div>
      </div>
    `;
  }).join('');
};

/* ─────────────────────────────────────────────────────────────
   NEW MESSAGE NOTIFICATION EMAIL
   Dispatched to all relevant parties whenever a new remark or
   message is added to the ticket conversation.
   ───────────────────────────────────────────────────────────── */

export const sendNewMessageNotificationEmail = async (
  toOrOpts,
  ticketParam,
  messageTextParam,
  senderParam,
  recipientRoleParam = 'clientuser',
  recipientNameParam = ''
) => {
  let to, ticket, messageText, sender, recipientRole, recipientName;
  if (typeof toOrOpts === 'object' && toOrOpts !== null && !Array.isArray(toOrOpts) && toOrOpts.to) {
    ({
      to,
      ticket = ticketParam,
      messageText = messageTextParam,
      sender = senderParam,
      recipientRole = 'clientuser',
      recipientName = '',
    } = toOrOpts);
  } else {
    to = toOrOpts;
    ticket = ticketParam;
    messageText = messageTextParam;
    sender = senderParam;
    recipientRole = recipientRoleParam;
    recipientName = recipientNameParam;
  }

  if (!to || !ticket) return;

  const senderName = sender?.name || 'A team member';
  const senderRole = (sender?.role || '').toLowerCase();
  const senderRoleLabel = senderRole === 'superadmin' ? 'Super Admin'
    : senderRole === 'consultant' ? 'Consultant' : 'Customer';

  const isClientRecipient = (recipientRole || '').toLowerCase() === 'clientuser';
  const clientName = ticket.client?.name || ticket.createdBy?.client?.name || ticket.clientName || '—';
  const assignedName = ticket.assignedTo?.name || (ticket.assignedConsultants?.length ? ticket.assignedConsultants.map(c => c.name).join(', ') : 'Unassigned');
  const creatorName = ticket.createdBy?.name || 'Customer';

  const historyHtml = renderConversationHistory(ticket.remarks, isClientRecipient, messageText);
  const nowFormatted = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const body = `
    <p style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 8px 0;">Hello ${escapeHtml(recipientName || 'Team')},</p>
    <p style="font-size:14px;color:#475569;margin:0 0 20px 0;line-height:1.7;">
      A new message has been posted on ticket <strong>#${ticket.ticketNumber}</strong> by <strong>${escapeHtml(senderName)}</strong> (${senderRoleLabel}).
    </p>

    ${sectionLabel('Latest Message')}
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background-color:#ffffff;border:1px solid #cbd5e1;border-left:4px solid #2563eb;
                  border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);margin-bottom:24px;width:100%;">
      <tr>
        <td style="padding:16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
            <tr>
              <td style="vertical-align:middle;">
                <span style="font-size:13.5px;font-weight:700;color:#0f172a;">${escapeHtml(senderName)}</span>
                <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;background:#e2e8f0;color:#334155;margin-left:6px;text-transform:uppercase;">${senderRoleLabel}</span>
              </td>
              <td style="text-align:right;vertical-align:middle;font-size:11.5px;color:#64748b;">
                ${nowFormatted}
              </td>
            </tr>
          </table>
          <div style="font-size:14px;color:#1e293b;line-height:1.75;white-space:pre-wrap;word-break:break-word;">
            ${escapeHtml(messageText)}
          </div>
        </td>
      </tr>
    </table>

    ${historyHtml ? `
      ${sectionLabel('Recent Conversation History')}
      <div style="margin-bottom:24px;">
        ${historyHtml}
      </div>
    ` : ''}

    ${sectionLabel('Ticket Context & Overview')}
    ${detailTable([
      infoRow('Ticket No.', `#${ticket.ticketNumber}`),
      infoRow('Subject',    ticket.title),
      infoRow('Client',     clientName),
      infoRow('Raised By',  creatorName),
      infoRow('Assigned To',assignedName),
      infoRow('Priority',   priorityBadge(ticket.priority)),
      infoRow('Status',     statusBadge(ticket.status || 'open'), true),
    ].join(''))}

    ${ticket.description ? descriptionBlock('Initial Issue Description', ticket.description) : ''}

    ${ctaButton(getClientUrl(), '💬  View & Reply in Support Portal', 'blue')}

    ${signOff('Akshay Support System', 'Akshay Software Technologies Pvt. Ltd.')}
  `;

  const html = emailWrapper(body);

  try {
    await sendMail({
      to,
      subject: `💬 New Message on Ticket [${ticket.ticketNumber}] | ${ticket.title}`,
      html,
      eventType: 'new_message',
      ticket,
    });
    console.log(`✅ NEW MESSAGE NOTIFICATION EMAIL SENT TO: ${to}`);
  } catch (err) {
    console.error(`❌ NEW MESSAGE NOTIFICATION EMAIL FAILED (${to}):`, err.message || err);
  }
};

/* ─────────────────────────────────────────────────────────────
   NOTIFY CONVERSATION PARTICIPANTS
   Finds every related person of that ticket thread and sends
   an email containing full ticket context & chat message.
   ───────────────────────────────────────────────────────────── */

export const notifyConversationParticipants = async ({
  ticket,
  messageText,
  sender,
  isInternal = false,
}) => {
  if (!ticket || !messageText || !messageText.trim()) return;

  try {
    const Ticket = (await import('../../models/Ticket.js')).default;
    const ClientUser = (await import('../../models/ClientUser.js')).default;
    const ConsultantProfile = (await import('../../models/ConsultantProfile.js')).default;

    // 1. Fully populate ticket so all context and relationships are available
    const populatedTicket = await Ticket.findById(ticket._id || ticket)
      .populate({
        path: 'createdBy',
        select: 'name email role clientName client',
        populate: { path: 'client', select: 'name contactEmail companyShortName' }
      })
      .populate({
        path: 'clientUser',
        select: 'name email role clientName client',
        populate: { path: 'client', select: 'name contactEmail companyShortName' }
      })
      .populate({
        path: 'client',
        select: 'name initials companyShortName domain contactEmail'
      })
      .populate({ path: 'assignedTo', select: 'name email role' })
      .populate({ path: 'assignedConsultants', select: 'name email role' })
      .populate({ path: 'department', select: 'name' })
      .populate({ path: 'remarks.addedBy', select: 'name email role' });

    if (!populatedTicket) return;

    const senderIdStr = String(sender?._id || sender?.id || '');
    const senderEmailLower = (sender?.email || '').toLowerCase().trim();
    const isInternalFlag = Boolean(isInternal === true || isInternal === 'true');

    // Deduplication map keyed by lowercased email
    const recipientMap = new Map();

    const addRecipient = (user, fallbackRole = 'clientuser') => {
      if (!user) return;
      const email = (typeof user === 'string' ? user : user.email)?.toLowerCase().trim();
      if (!email || !email.includes('@')) return;

      // Do NOT send to the sender
      if (email === senderEmailLower) return;
      if (user._id && String(user._id) === senderIdStr) return;

      const role = (user.role || fallbackRole || 'clientuser').toLowerCase();

      // If internal message, NEVER send to client users / customers
      if (isInternalFlag && (role === 'clientuser' || role === 'user' || role === 'customer')) {
        return;
      }

      if (!recipientMap.has(email)) {
        recipientMap.set(email, {
          email,
          name: user.name || user.email?.split('@')[0] || 'Team Member',
          role: user.role || fallbackRole,
        });
      }
    };

    // A. Ticket Creator
    if (populatedTicket.createdBy) {
      addRecipient(populatedTicket.createdBy, 'clientuser');
    }

    // B. Submitter / ClientUser
    if (populatedTicket.clientUser) {
      addRecipient(populatedTicket.clientUser, 'clientuser');
    }

    // C. Client Organization Contact Email (if not internal note)
    if (!isInternalFlag) {
      const clientContact =
        populatedTicket.client?.contactEmail ||
        populatedTicket.createdBy?.client?.contactEmail ||
        populatedTicket.clientUser?.client?.contactEmail;
      if (clientContact) {
        addRecipient({
          email: clientContact,
          name: populatedTicket.client?.name || 'Client Contact',
          role: 'clientuser',
        });
      }
    }

    // D. Primary Assigned Consultant
    if (populatedTicket.assignedTo) {
      addRecipient(populatedTicket.assignedTo, 'consultant');
    }

    // E. Co-Assigned Consultants
    if (Array.isArray(populatedTicket.assignedConsultants)) {
      populatedTicket.assignedConsultants.forEach(c => addRecipient(c, 'consultant'));
    }

    // F. All Previous Participants in the Conversation
    if (Array.isArray(populatedTicket.remarks)) {
      populatedTicket.remarks.forEach(rem => {
        if (rem.addedBy) {
          addRecipient(rem.addedBy, rem.addedBy.role || 'consultant');
        }
      });
    }

    // G. Ticket CC Emails (if not internal note)
    if (!isInternalFlag && Array.isArray(populatedTicket.ccEmails)) {
      populatedTicket.ccEmails.forEach(ccEm => {
        if (typeof ccEm === 'string' && ccEm.includes('@')) {
          addRecipient({
            email: ccEm.trim(),
            name: ccEm.split('@')[0],
            role: 'clientuser',
          });
        }
      });
    }

    // H. If NO consultant is assigned to this ticket:
    // Ensure Super Admins and department consultants get notified so conversation is never dropped
    const hasAnyConsultant =
      Boolean(populatedTicket.assignedTo) ||
      (Array.isArray(populatedTicket.assignedConsultants) && populatedTicket.assignedConsultants.length > 0);

    if (!hasAnyConsultant) {
      const superAdmins = await ClientUser.find({ role: 'superadmin', status: 'active' }).select('name email role');
      superAdmins.forEach(sa => addRecipient(sa, 'superadmin'));

      if (populatedTicket.department) {
        const consultantProfiles = await ConsultantProfile.find({
          department: populatedTicket.department._id || populatedTicket.department,
        }).populate('user', 'name email role');
        consultantProfiles.forEach(p => {
          if (p.user) addRecipient(p.user, 'consultant');
        });
      }
    }

    console.log(
      `📬 Dispatching conversation email for ticket #${populatedTicket.ticketNumber} to ${recipientMap.size} recipient(s):`,
      Array.from(recipientMap.keys())
    );

    // Send email to every related person
    for (const recipient of recipientMap.values()) {
      sendNewMessageNotificationEmail({
        to: recipient.email,
        ticket: populatedTicket,
        messageText,
        sender,
        recipientRole: recipient.role,
        recipientName: recipient.name,
      }).catch(err => {
        console.error(`❌ Conversation email to ${recipient.email} failed:`, err.message);
      });
    }
  } catch (err) {
    console.error('❌ notifyConversationParticipants error:', err.message);
  }
};
