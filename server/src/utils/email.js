/* ─────────────────────────────────────────────────────────────
   EMAIL UTILITY SHIM — compatibility layer
   Re-exports all email helper functions from the restructured
   reusable email modules located in server/src/email/index.js.
   This prevents any changes to the existing import pathways
   in auth.service.js, client.service.js, and ticket.service.js.
   ───────────────────────────────────────────────────────────── */

export {
  sendTicketCreatedEmail,
  sendConsultantTicketAlertEmail,
  sendTicketResolvedEmail,
  sendTokenCompletedEmail,
  sendTicketForwardedUserEmail,
  sendTicketForwardedConsultantEmail,
  sendTicketAssignedConsultantEmail,
  sendTicketStatusUpdatedEmail,
  sendNewMessageNotificationEmail,
  sendWelcomeCredentialsEmail,
  sendTemporaryPasswordEmail,
} from '../email/index.js';
