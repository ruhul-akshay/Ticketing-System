import { ctaButton, alertBox, stepList, signOff, sectionLabel } from '../components.js';
import { emailWrapper, getClientUrl } from '../layout.js';
import { sendMail } from '../transporter.js';

/* ─────────────────────────────────────────────────────────────
   TEMPORARY PASSWORD EMAIL
   Sent when an admin resets a user's password and a temporary
   credential is generated.
   ───────────────────────────────────────────────────────────── */

export const sendTemporaryPasswordEmail = async (to, userName, tempPassword) => {
  // FIX: added missing guard (was absent unlike every other template)
  if (!to) return;

  try {
    const body = `
      <p style="font-size:13px;font-weight:700;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px 0;">Password Reset</p>
      <p style="font-size:26px;font-weight:900;color:#0f172a;margin:0 0 16px 0;letter-spacing:-0.02em;">Your Temporary Password</p>
      <p style="font-size:14px;color:#475569;margin:0 0 28px 0;line-height:1.7;">Hi <strong>${userName || 'there'}</strong>, a temporary password has been generated for your Akshay Support Portal account.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(160deg,#0a0f1e 0%,#0f172a 55%,#1a2744 100%);border-radius:14px;margin-bottom:28px;overflow:hidden;">
        <tr>
          <td style="padding:32px;text-align:center;">
            <p style="margin:0 0 12px 0;font-size:10px;font-weight:800;color:#475569;letter-spacing:0.2em;text-transform:uppercase;">TEMPORARY PASSWORD</p>
            <div style="display:inline-block;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:16px 36px;">
              <span style="font-family:'Courier New',Courier,monospace;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:0.2em;">${tempPassword}</span>
            </div>
            <p style="margin:14px 0 0 0;font-size:12px;color:#475569;">Valid for <strong style="color:#94a3b8;">immediate use</strong>. Change it after logging in.</p>
          </td>
        </tr>
      </table>

      ${sectionLabel('Next Steps')}

      ${stepList([
        'Log in with your email and the temporary password above.',
        'Navigate to <strong>Profile Settings</strong> and change your password immediately.',
        'Keep your new password secure and do not share it with anyone.',
      ])}

      ${/* FIX: was alertBox('<strong>⚠️ Security Notice:...</strong>', 'danger') — args were swapped */
        alertBox('danger', '<strong>⚠️ Security Notice:</strong> If you did not request this password reset, contact your system administrator immediately.')}

      ${signOff()}
    `;

    const html = emailWrapper(body);

    await sendMail({
      to,
      subject: `Your Temporary Password — Akshay Support Portal`,
      html,
      eventType: 'password_reset',
    });

    console.log(`✅ TEMPORARY PASSWORD EMAIL SENT TO: ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send temporary password email to ${to}:`, error);
    throw error;
  }
};
