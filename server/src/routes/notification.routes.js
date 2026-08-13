import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as controller from '../controllers/notification.controller.js';
import { upload } from '../utils/ticket.helpers.js';

const router = express.Router();

router.get('/', authenticate, controller.getNotifications);
router.post('/', authenticate, authorize('superadmin'), upload.array('attachments', 10), controller.createNotification);
router.put('/:id/read', authenticate, controller.markAsRead);
router.get('/:notificationId/attachment/:attachmentId', authenticate, controller.downloadAttachment);

export default router;
