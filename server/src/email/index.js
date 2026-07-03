/* ─────────────────────────────────────────────────────────────
   EMAIL MODULE — barrel export
   Re-exports every send-function from all templates so callers
   can import from 'email/index.js' or the utils/email.js shim.
   ───────────────────────────────────────────────────────────── */

export { sendTicketCreatedEmail }          from './templates/ticketCreated.js';
export { sendConsultantTicketAlertEmail }  from './templates/consultantAlert.js';
export { sendTicketResolvedEmail }         from './templates/ticketResolved.js';
export { sendTokenCompletedEmail }         from './templates/tokenCompleted.js';
export { sendTicketForwardedUserEmail }    from './templates/ticketForwardedUser.js';
export { sendTicketForwardedConsultantEmail } from './templates/ticketForwardedConsultant.js';
export { sendTicketAssignedConsultantEmail }  from './templates/ticketAssignedConsultant.js';
export { sendTicketStatusUpdatedEmail }    from './templates/ticketStatusUpdated.js';
export { sendNewMessageNotificationEmail } from './templates/newMessage.js';
export { sendWelcomeCredentialsEmail }     from './templates/welcomeCredentials.js';
export { sendTemporaryPasswordEmail }      from './templates/temporaryPassword.js';
