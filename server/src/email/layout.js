/* ─────────────────────────────────────────────────────────────
   EMAIL LAYOUT  — shared HTML shell
   Header: dark gradient + company badge + accent bar
   Footer: copyright + portal link
   ───────────────────────────────────────────────────────────── */

export const getClientUrl = () =>
  process.env.CLIENT_URL || 'http://ticketing.akshay.com';

/* ── Header ──────────────────────────────────────────────────── */
const header = () => `
  <tr>
    <td style="background:linear-gradient(160deg,#0a0f1e 0%,#0f172a 55%,#1a2744 100%);padding:0;">

      <!-- Top identity bar -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:28px 40px 0 40px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:rgba(237,27,47,0.15);border:1px solid rgba(237,27,47,0.35);border-radius:5px;padding:4px 12px;">
                  <span style="color:#ED1B2F;font-size:9px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;">
                    AKSHAY SOFTWARE TECHNOLOGIES PVT. LTD.
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 40px 30px 40px;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.03em;display:block;line-height:1.1;">
                    Support Portal
                  </span>
                  <span style="color:#475569;font-size:11px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;">
                    Automated Notification
                  </span>
                </td>
                <!-- Decorative icon box -->
                <td style="text-align:right;vertical-align:bottom;">
                  <div style="display:inline-block;width:42px;height:42px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;text-align:center;line-height:42px;font-size:20px;">
                    🎫
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Red accent bar -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="height:3px;background:linear-gradient(90deg,#ED1B2F 0%,#b91c1c 60%,rgba(185,28,28,0) 100%);font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>

    </td>
  </tr>
`;

/* ── Footer ──────────────────────────────────────────────────── */
const footer = () => `
  <tr>
    <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;border-bottom-left-radius:16px;border-bottom-right-radius:16px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0 0 3px 0;font-size:12px;color:#64748b;font-weight:600;">
              © ${new Date().getFullYear()} Akshay Software Technologies Pvt. Ltd.  
            </p>
            <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
              This is an automated notification — please do not reply to this email.<br/>
              For assistance, log in to your support portal or contact your account manager.
            </p>
          </td>
          <td style="text-align:right;vertical-align:top;padding-left:20px;white-space:nowrap;">
            <a href="${getClientUrl()}" target="_blank"
               style="font-size:11px;font-weight:700;color:#2563eb;text-decoration:none;letter-spacing:0.03em;">
              Open Portal →
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

/* ── Wrapper ──────────────────────────────────────────────────── */
/**
 * Wraps email body HTML in the full responsive shell.
 * @param {string} body  Inner HTML string
 * @returns {string}     Complete email HTML document
 */
export const emailWrapper = (body) => `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Akshay Support Notification</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Outer table (background) -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#eef2f7;padding:40px 16px;width:100%;min-width:320px;">
    <tr>
      <td align="center">

        <!-- Email card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:620px;width:100%;background-color:#ffffff;border-radius:16px;
                      overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);
                      border:1px solid #dde3ee;">

          ${header()}

          <!-- Body content -->
          <tr>
            <td style="padding:40px 40px 32px 40px;color:#334155;background-color:#ffffff;">
              ${body}
            </td>
          </tr>

          ${footer()}

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;
