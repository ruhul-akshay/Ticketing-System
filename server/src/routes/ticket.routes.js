import express from 'express';
import * as ticketController from '../controllers/ticket.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../utils/ticket.helpers.js';

const router = express.Router();

// Specific routes first to avoid parameter collisions
router.get('/dashboard/stats', authenticate, ticketController.getStats);
router.post('/test', authenticate, ticketController.testTicketRoute);
router.get('/export/csv', authenticate, ticketController.exportCSV);

// Collection routes
router.get('/', authenticate, ticketController.getTickets);
router.post(
  '/',
  authenticate,
  upload.fields([
    { name: 'attachments', maxCount: 10 },
    { name: 'supportingDocuments', maxCount: 10 },
    { name: 'adminAttachments', maxCount: 10 }
  ]),
  ticketController.createTicket
);
router.post('/json', authenticate, ticketController.createTicketJson);

// Ticket detail operations
router.get('/:id', authenticate, ticketController.getTicket);
router.delete('/:id', authenticate, authorize('superadmin'), ticketController.deleteTicket);

router.put(
  '/:id',
  authenticate,
  upload.fields([
    { name: 'attachments', maxCount: 10 },
    { name: 'supportingDocuments', maxCount: 10 },
    { name: 'adminAttachments', maxCount: 10 },
    { name: 'remarkAttachments', maxCount: 10 }
  ]),
  ticketController.updateTicket
);

router.post('/:id/feedback', authenticate, ticketController.submitFeedback);
router.patch('/:id/status', authenticate, authorize('admin', 'superadmin'), ticketController.updateStatus);
router.patch('/:id/open', authenticate, ticketController.markAsOpened);
router.post('/:id/remarks', authenticate, ticketController.addRemark);
router.post('/:id/assign', authenticate, authorize('superadmin'), ticketController.assignTicket);
router.post('/:id/forward', authenticate, ticketController.forwardTicket);

// Work logs sub-resource routes
router.put('/:id/worklogs/:logId', authenticate, ticketController.updateWorkLog);
router.delete('/:id/worklogs/:logId', authenticate, ticketController.deleteWorkLog);

// Attachments sub-resource routes
router.get('/:ticketId/attachments', authenticate, ticketController.getAttachments);
router.get('/:ticketId/attachment/:attachmentId', authenticate, ticketController.downloadAttachment);
router.get('/:ticketId/view/:attachmentId', authenticate, ticketController.viewAttachmentInline);
router.post('/:ticketId/attachments', authenticate, upload.array('attachments', 10), ticketController.addAttachments);
router.delete('/:ticketId/attachment/:attachmentId', authenticate, ticketController.deleteAttachment);

export default router;
