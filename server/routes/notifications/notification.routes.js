import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import * as controller from './notification.controller.js';

const router = express.Router();

router.get('/', authenticate, controller.getNotifications);
router.post('/', authenticate, authorize('superadmin'), controller.createNotification);
router.put('/:id/read', authenticate, controller.markAsRead);

export default router;
