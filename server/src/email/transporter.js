import nodemailer from 'nodemailer';
import CcEmailConfig from '../models/CcEmailConfig.js';
import SystemSetting from '../models/SystemSetting.js';

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
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    _transporter.verify((err) => {
      if (err) console.error('❌ SMTP VERIFY FAILED:', err.message);
      else     console.log('✅ SMTP CONNECTED (Office365)');
    });
  }
  return _transporter;
};

/* ─────────────────────────────────────────────────────────────
   COMPANY SHORT NAME CACHE
   Avoids a DB query on every email send by caching the value
   for CACHE_TTL_MS milliseconds. Falls back to env var or 'ASTPL'.
   ───────────────────────────────────────────────────────────── */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let _cachedShortName    = null;
let _cacheExpiresAt     = 0;

const getCompanyShortName = async () => {
  const now = Date.now();
  if (_cachedShortName && now < _cacheExpiresAt) {
    return _cachedShortName;
  }
  try {
    const setting = await SystemSetting.findOne({ key: 'companyShortName' });
    _cachedShortName  = (setting?.value ? String(setting.value).trim() : null)
      || process.env.COMPANY_SHORT_NAME
      || 'ASTPL';
  } catch {
    _cachedShortName = process.env.COMPANY_SHORT_NAME || 'ASTPL';
  }
  _cacheExpiresAt = now + CACHE_TTL_MS;
  return _cachedShortName;
};

/* ─────────────────────────────────────────────────────────────
   SEND HELPER
   ───────────────────────────────────────────────────────────── */

/**
 * Send an email, automatically prepending the company short-name
 * tag to the subject and appending any dynamic CC recipients that
 * have subscribed to the given eventType.
 *
 * @param {{ to: string|string[], cc?: string|string[], subject: string, html: string, eventType?: string }} opts
 */
export const sendMail = async ({ to, cc, subject, html, eventType }) => {
  const ccList = [cc].flat().filter(Boolean);

  if (eventType) {
    try {
      const dynamicCcConfigs = await CcEmailConfig.find({
        isActive    : true,
        [eventType] : true,
      }).select('email');
      ccList.push(...dynamicCcConfigs.map(c => c.email));
    } catch (err) {
      console.error(`❌ Error fetching dynamic CC emails for event ${eventType}:`, err.message);
    }
  }

  // Deduplicate CC list
  const dedupCcList = [...new Set(ccList)];

  // Prefix subject with company short name (cached — no extra DB hit per send)
  const companyShortName  = await getCompanyShortName();
  let   formattedSubject  = subject || '';
  const prefixTag = `[${companyShortName}]`;
  if (!formattedSubject.trim().toLowerCase().startsWith(prefixTag.toLowerCase())) {
    formattedSubject = `${prefixTag} ${formattedSubject}`;
  }

  // Configurable sender display name via SMTP_FROM_NAME env var
  const fromName = process.env.SMTP_FROM_NAME || 'Akshay Support';

  await getTransporter().sendMail({
    from   : `"${fromName}" <${process.env.SMTP_USER}>`,
    to,
    cc     : dedupCcList.length > 0 ? dedupCcList : undefined,
    subject: formattedSubject,
    html,
  });
};

/**
 * Invalidate the cached company short name.
 * Call this after saving a new companyShortName system setting.
 */
export const invalidateCompanyShortNameCache = () => {
  _cachedShortName = null;
  _cacheExpiresAt  = 0;
};
