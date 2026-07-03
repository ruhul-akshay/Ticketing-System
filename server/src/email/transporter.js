import nodemailer from 'nodemailer';
import CcEmailConfig from '../models/CcEmailConfig.js';

/* ─────────────────────────────────────────────────────────────
   SMTP TRANSPORTER  — Office365 singleton
   ───────────────────────────────────────────────────────────── */

let _transporter = null;

export const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: { rejectUnauthorized: false }
    });

    _transporter.verify((err) => {
      if (err) console.error('❌ SMTP VERIFY FAILED:', err.message);
      else     console.log('✅ SMTP CONNECTED (Office365)');
    });
  }
  return _transporter;
};

/* ─────────────────────────────────────────────────────────────
   SEND HELPER
   ───────────────────────────────────────────────────────────── */

/**
 * @param {{ to: string|string[], cc?: string|string[], subject: string, html: string, eventType?: string }} opts
 */
export const sendMail = async ({ to, cc, subject, html, eventType }) => {
  const ccList = [cc].flat().filter(Boolean);

  if (eventType) {
    try {
      // Fetch active configurations that have subscribed to this event type
      const dynamicCcConfigs = await CcEmailConfig.find({
        isActive: true,
        [eventType]: true
      }).select('email');

      const dynamicEmails = dynamicCcConfigs.map(c => c.email);
      ccList.push(...dynamicEmails);
    } catch (err) {
      console.error(`❌ Error fetching dynamic CC emails for event ${eventType}:`, err.message);
    }
  }

  // Deduplicate CC list
  const dedupCcList = [...new Set(ccList)];

  await getTransporter().sendMail({
    from   : `"Akshay Support" <${process.env.SMTP_USER}>`,
    to,
    cc     : dedupCcList.length > 0 ? dedupCcList : undefined,
    subject,
    html
  });
};
