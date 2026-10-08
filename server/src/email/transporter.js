import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import CcEmailConfig from '../models/CcEmailConfig.js';
import SystemSetting from '../models/SystemSetting.js';
import Client from '../models/Client.js';
import ClientUser from '../models/ClientUser.js';
import Ticket from '../models/Ticket.js';
import { generateCompanyShortName } from '../utils/ticket.helpers.js';

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

export const getCompanyShortName = async () => {
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
   RESOLVE CLIENT SHORT NAME
   Resolves client short name from ticket (or explicit parameter)
   ───────────────────────────────────────────────────────────── */

const isRealObjectId = (val) => {
  if (!val) return false;
  if (typeof val === 'string') return /^[0-9a-fA-F]{24}$/.test(val);
  return Boolean(val instanceof mongoose.Types.ObjectId || val?._bsontype === 'ObjectId');
};

const getClientShortNameFromDoc = (doc) => {
  if (!doc || isRealObjectId(doc)) return null;
  if (doc.companyShortName && typeof doc.companyShortName === 'string' && doc.companyShortName.trim()) {
    return doc.companyShortName.trim();
  }
  if (doc.name && typeof doc.name === 'string' && doc.name.trim()) {
    return generateCompanyShortName(doc.name);
  }
  return null;
};

const findClientByName = async (rawName) => {
  if (!rawName || typeof rawName !== 'string' || !rawName.trim()) return null;
  try {
    const trimmed = rawName.trim();
    const esc = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const doc = await Client.findOne({ name: { $regex: new RegExp(`^${esc}$`, 'i') } })
      .select('companyShortName name')
      .lean();
    if (doc) return getClientShortNameFromDoc(doc);

    const looseDoc = await Client.findOne({ name: { $regex: new RegExp(esc, 'i') } })
      .select('companyShortName name')
      .lean();
    if (looseDoc) return getClientShortNameFromDoc(looseDoc);

    return generateCompanyShortName(trimmed);
  } catch {
    return generateCompanyShortName(rawName);
  }
};

export const resolveClientShortName = async (ticket, explicitShortName) => {
  if (explicitShortName && typeof explicitShortName === 'string' && explicitShortName.trim()) {
    return explicitShortName.trim();
  }

  if (!ticket) return null;

  // ── 1. FAST IN-MEMORY CHECKS (ZERO DB LATENCY) ──────────────────────────
  try {
    // Check ticket.client populated
    if (ticket.client && !isRealObjectId(ticket.client)) {
      const s = getClientShortNameFromDoc(ticket.client);
      if (s) return s;
    }

    // Check ticket.createdBy.client populated
    if (ticket.createdBy?.client && !isRealObjectId(ticket.createdBy.client)) {
      const s = getClientShortNameFromDoc(ticket.createdBy.client);
      if (s) return s;
    }

    // Check ticket.clientUser.client populated
    if (ticket.clientUser?.client && !isRealObjectId(ticket.clientUser.client)) {
      const s = getClientShortNameFromDoc(ticket.clientUser.client);
      if (s) return s;
    }

    // Check string client names on ticket or creator
    if (ticket.clientName && typeof ticket.clientName === 'string' && ticket.clientName.trim()) {
      return generateCompanyShortName(ticket.clientName);
    }
    if (ticket.createdBy?.clientName && typeof ticket.createdBy.clientName === 'string' && ticket.createdBy.clientName.trim()) {
      return generateCompanyShortName(ticket.createdBy.clientName);
    }
    if (ticket.clientUser?.clientName && typeof ticket.clientUser.clientName === 'string' && ticket.clientUser.clientName.trim()) {
      return generateCompanyShortName(ticket.clientUser.clientName);
    }
  } catch (memErr) {
    console.error('Error during in-memory client resolution:', memErr.message);
  }

  // ── 2. DATABASE FALLBACKS (WHEN IDS ARE UNPOPULATED) ────────────────────
  try {
    // Fallback A: ticket.client is an ObjectId
    const clientId = isRealObjectId(ticket.client) ? ticket.client : (isRealObjectId(ticket.client?._id) ? ticket.client._id : null);
    if (clientId) {
      const cDoc = await Client.findById(clientId).select('companyShortName name').lean();
      const s = getClientShortNameFromDoc(cDoc);
      if (s) return s;
    }

    // Fallback B: ticket.createdBy.client is an ObjectId
    const createdByClientId = isRealObjectId(ticket.createdBy?.client) ? ticket.createdBy.client : (isRealObjectId(ticket.createdBy?.client?._id) ? ticket.createdBy.client._id : null);
    if (createdByClientId) {
      const cDoc = await Client.findById(createdByClientId).select('companyShortName name').lean();
      const s = getClientShortNameFromDoc(cDoc);
      if (s) return s;
    }

    // Fallback C: ticket.clientUser.client is an ObjectId
    const cuClientId = isRealObjectId(ticket.clientUser?.client) ? ticket.clientUser.client : (isRealObjectId(ticket.clientUser?.client?._id) ? ticket.clientUser.client._id : null);
    if (cuClientId) {
      const cDoc = await Client.findById(cuClientId).select('companyShortName name').lean();
      const s = getClientShortNameFromDoc(cDoc);
      if (s) return s;
    }

    // Fallback D: ticket.createdBy is an unpopulated User ID
    const creatorUserId = isRealObjectId(ticket.createdBy) ? ticket.createdBy : (isRealObjectId(ticket.createdBy?._id) ? ticket.createdBy._id : null);
    if (creatorUserId) {
      const uDoc = await ClientUser.findById(creatorUserId).populate('client').lean();
      if (uDoc) {
        const s = getClientShortNameFromDoc(uDoc.client);
        if (s) return s;
        if (uDoc.clientName) return generateCompanyShortName(uDoc.clientName);
      }
    }

    // Fallback E: ticket.clientUser is an unpopulated User ID
    const cuUserId = isRealObjectId(ticket.clientUser) ? ticket.clientUser : (isRealObjectId(ticket.clientUser?._id) ? ticket.clientUser._id : null);
    if (cuUserId) {
      const uDoc = await ClientUser.findById(cuUserId).populate('client').lean();
      if (uDoc) {
        const s = getClientShortNameFromDoc(uDoc.client);
        if (s) return s;
        if (uDoc.clientName) return generateCompanyShortName(uDoc.clientName);
      }
    }

    // Fallback F: Extract client initials from ticket number e.g. T260922BD299 -> "BD"
    const ticketNumberStr = ticket.ticketNumber || (typeof ticket === 'string' && ticket.startsWith('T') ? ticket : null);
    if (ticketNumberStr) {
      const match = ticketNumberStr.match(/^T\d{6}([A-Z]{2})\d{3}$/);
      if (match && match[1] && match[1] !== 'GP' && match[1] !== 'AS') {
        const cDoc = await Client.findOne({ initials: match[1] }).select('companyShortName name').lean();
        const s = getClientShortNameFromDoc(cDoc);
        if (s) return s;
      }
    }

    // Fallback G: ticket is an ID or has _id
    const ticketId = isRealObjectId(ticket) ? ticket : (isRealObjectId(ticket._id) ? ticket._id : null);
    if (ticketId) {
      const fresh = await Ticket.findById(ticketId)
        .populate([
          { path: 'client', select: 'companyShortName name' },
          { path: 'createdBy', select: 'clientName client', populate: { path: 'client', select: 'companyShortName name' } },
          { path: 'clientUser', select: 'clientName client', populate: { path: 'client', select: 'companyShortName name' } }
        ])
        .lean();
      if (fresh) {
        const s1 = getClientShortNameFromDoc(fresh.client);
        if (s1) return s1;
        const s2 = getClientShortNameFromDoc(fresh.createdBy?.client);
        if (s2) return s2;
        const s3 = getClientShortNameFromDoc(fresh.clientUser?.client);
        if (s3) return s3;
        if (fresh.createdBy?.clientName) return generateCompanyShortName(fresh.createdBy.clientName);
        if (fresh.clientName) return generateCompanyShortName(fresh.clientName);
      }
    }
  } catch (dbErr) {
    console.error('❌ DB Fallback in resolveClientShortName failed:', dbErr.message);
  }

  return null;
};

/* ─────────────────────────────────────────────────────────────
   FORMAT EMAIL SUBJECT
   Pattern:
   - With clientShortName & emoji:
     `Fristam : 🚨  [ASTPL] Forwarded Ticket [T260922BD299] — Assigned to You | Title`
   - With clientShortName (no emoji):
     `Fristam : [ASTPL] Ticket [T260922BD299]`
   - Without clientShortName & emoji:
     `🚨  [ASTPL] Forwarded Ticket [T260922BD299]`
   - Without clientShortName (no emoji):
     `[ASTPL] Ticket [T260922BD299]`
   ───────────────────────────────────────────────────────────── */

export const formatEmailSubject = ({ subject = '', systemShortName = 'ASTPL', clientShortName = '' }) => {
  let str = (subject || '').trim();
  const sysTag = `[${systemShortName}]`;
  if (!str) return clientShortName ? `${clientShortName} : ${sysTag}` : sysTag;

  // Strip literal placeholder prefixes like "client short name : " or "company short name : "
  str = str.replace(/^(?:client\s*(?:short\s*)?name|company\s*(?:short\s*)?name)\s*:\s*/i, '').trim();

  // Strip existing clientShortName prefix if already present (e.g. "Fristam : ")
  if (clientShortName) {
    const escClient = clientShortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    str = str.replace(new RegExp(`^${escClient}\\s*:\\s*`, 'i'), '').trim();
  }

  // Strip any prior prefix matching "<Word> : " before emoji or '['
  str = str.replace(/^[A-Za-z0-9_\-\s&.]+\s*:\s*(?=[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\[]|$)/u, '').trim();

  // Strip existing system prefix tag (e.g. "[ASTPL] ")
  const escSys = systemShortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  str = str.replace(new RegExp(`^\\[${escSys}\\]\\s*`, 'i'), '').trim();

  // Match leading emoji(s) (supports unicode emojis, pictographs, variation selectors)
  const emojiRegex = /^([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}]+)\s*(.*)$/u;
  const match = str.match(emojiRegex);

  let leadEmoji = '';
  let remainder = str;

  if (match) {
    leadEmoji = match[1].trim();
    remainder = match[2].trim();
    // In case remainder still has [ASTPL] after emoji (e.g. "🚨 [ASTPL] Forwarded...")
    remainder = remainder.replace(new RegExp(`^\\[${escSys}\\]\\s*`, 'i'), '').trim();
  }

  const cleanClient = (clientShortName || '').trim();

  if (cleanClient) {
    if (leadEmoji) {
      return `${cleanClient} : ${leadEmoji}  ${sysTag} ${remainder}`.trim();
    } else {
      return `${cleanClient} : ${sysTag} ${remainder}`.trim();
    }
  } else {
    if (leadEmoji) {
      return `${leadEmoji}  ${sysTag} ${remainder}`.trim();
    } else {
      return `${sysTag} ${remainder}`.trim();
    }
  }
};

/* ─────────────────────────────────────────────────────────────
   SEND HELPER
   ───────────────────────────────────────────────────────────── */

/**
 * Send an email, automatically prepending the company short-name
 * and client short-name tags to the subject and appending any dynamic CC recipients.
 *
 * @param {{ to: string|string[], cc?: string|string[], subject: string, html: string, eventType?: string, ticket?: object, clientShortName?: string }} opts
 */
export const sendMail = async ({ to, cc, subject, html, eventType, ticket, clientShortName }) => {
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

  // Prefix subject with client short name and system short name
  const systemShortName = await getCompanyShortName();
  const resolvedClientShortName = await resolveClientShortName(ticket, clientShortName);

  const formattedSubject = formatEmailSubject({
    subject: subject || '',
    systemShortName,
    clientShortName: resolvedClientShortName,
  });

  // Configurable sender display name via SMTP_FROM_NAME env var
  const fromName = process.env.SMTP_FROM_NAME || 'Akshay Support';

  console.log(`📧 SENDING EMAIL to: ${to} | ClientShortName: "${resolvedClientShortName || 'none'}" | Subject: "${formattedSubject}"`);

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
