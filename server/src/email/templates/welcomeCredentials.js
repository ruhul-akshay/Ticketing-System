import { ctaButton, alertBox, signOff, sectionLabel } from '../components.js';
import { emailWrapper, getClientUrl } from '../layout.js';
import { sendMail } from '../transporter.js';

export const sendWelcomeCredentialsEmail = async (to, name, clientName, email, password, eventType = 'client_user_created') => {
  if (!to) return;

  try {
    const body = `
      <p style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 12px 0;">
        Welcome, <strong>${name || 'Valued Customer'}</strong>!
      </p>

      <p style="font-size:14px;color:#475569;margin:0 0 24px 0;line-height:1.7;">
        Your account on the <strong>Akshay Support Portal</strong> has been created
        ${clientName ? `for <strong>${clientName}</strong>` : ''}.
        Use the credentials below to log in and get started. Please keep them safe and
        do not share them with anyone.
      </p>

      <!-- Dark Credentials Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(160deg,#0a0f1e 0%,#0f172a 55%,#1a2744 100%);border-radius:14px;margin-bottom:24px;overflow:hidden;">
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px 0;font-size:10px;font-weight:800;color:#64748b;letter-spacing:0.2em;text-transform:uppercase;">Your Login Credentials</p>

            <!-- Email Row -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td style="width:90px;padding-bottom:4px;vertical-align:middle;">
                  <span style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:0.12em;text-transform:uppercase;">Email</span>
                </td>
                <td style="padding-bottom:4px;vertical-align:middle;">
                  <span style="font-size:14px;font-weight:600;color:#e2e8f0;">${email || '—'}</span>
                </td>
              </tr>
            </table>

            <!-- Password Row -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:90px;padding-bottom:4px;vertical-align:middle;">
                  <span style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:0.12em;text-transform:uppercase;">Password</span>
                </td>
                <td style="padding-bottom:4px;vertical-align:middle;">
                  <span style="font-family:'Courier New',Courier,monospace;font-size:22px;font-weight:900;color:#ED1B2F;letter-spacing:0.05em;">${password}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${alertBox('warning', `⚠️ <strong>First Login Required:</strong> After logging in, you will be prompted to complete your profile — your name, phone number, and position.`)}

      <div style="margin-top:24px;margin-bottom:12px;">
        ${sectionLabel('What You Can Do')}
      </div>
      
      ${alertBox('success', `
        <ul style="margin:0;padding-left:20px;font-size:13.5px;color:#1e293b;line-height:1.75;">
          <li>Submit and track technical support requests</li>
          <li>Communicate directly with assigned support consultants</li>
          <li>View real-time status and progress updates of your tickets</li>
          <li>Attach supporting documents and screenshots to your tickets</li>
        </ul>
      `)}

      ${ctaButton(getClientUrl(), '🔐  Login to Support Portal', 'red')}

      ${signOff()}
    `;

    const html = emailWrapper(body);

    await sendMail({
      to,
      subject: 'Welcome to Akshay Support Portal — Your Login Credentials',
      html,
      eventType,
    });

    console.log(`✅ WELCOME CREDENTIALS EMAIL SENT TO: ${to}`);
  } catch (err) {
    console.error('❌ WELCOME CREDENTIALS EMAIL FAILED:', err.message || err);
  }
};
