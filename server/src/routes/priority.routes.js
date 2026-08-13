import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as controller from '../controllers/priority.controller.js';

const router = express.Router();

/* Public for authenticated users */
router.get('/', authenticate, controller.getPriorities);

/* Superadmin only */
router.post(
  '/',
  authenticate,
  authorize('superadmin'),
  controller.createPriority
);

router.patch(
  '/:id',
  authenticate,
  authorize('superadmin'),
  controller.updatePriority
);

router.delete(
  '/:id',
  authenticate,
  authorize('superadmin'),
  controller.deletePriority
);

export default router;
