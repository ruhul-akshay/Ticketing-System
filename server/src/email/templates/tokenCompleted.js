import { infoRow, detailTable, ctaButton, signOff } from '../components.js';
import { emailWrapper, getClientUrl } from '../layout.js';
import { sendMail } from '../transporter.js';

/* ─────────────────────────────────────────────────────────────
   TOKEN COMPLETED EMAIL
   Sent to the token/request creator when their service request
   is marked as completed.
   ───────────────────────────────────────────────────────────── */

export const sendTokenCompletedEmail = async (to, token) => {
  if (!to) return;

  const body = `
    <p style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 12px 0;">Hello <strong>${token.createdBy?.name || 'User'}</strong>,</p>
    <p style="font-size:14px;color:#475569;margin:0 0 24px 0;line-height:1.7;">Your service request has been processed and completed successfully.</p>
    ${detailTable([
      infoRow('Request No.', token.ticketNumber, true),
    ])}
    ${/* FIX: was ctaButton('⚙️  View Service Request', getClientUrl(), 'blue') — url and text args were swapped */
      ctaButton(getClientUrl(), '⚙️  View Service Request', 'blue')}
    ${signOff()}
  `;

  const html = emailWrapper(body);

  try {
    await sendMail({
      to,
      subject: `Completed: Request ${token.ticketNumber}`,
      html,
      eventType: 'ticket_status_updated',
    });
    console.log(`✅ TOKEN COMPLETED EMAIL SENT TO: ${to}`);
  } catch (err) {
    console.error('❌ TOKEN COMPLETED EMAIL FAILED:', err.message || err);
  }
};
