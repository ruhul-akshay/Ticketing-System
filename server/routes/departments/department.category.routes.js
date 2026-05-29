import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import * as controller from './department.controller.js';

const router = express.Router();

router.post(
  '/:departmentId/categories',
  authenticate,
  authorize('superadmin'),
  controller.addCategory
);

router.patch(
  '/:departmentId/categories/:categoryId',
  authenticate,
  authorize('superadmin'),
  controller.updateCategory
);

router.delete(
  '/:departmentId/categories/:categoryId',
  authenticate,
  authorize('superadmin'),
  controller.deleteCategory
);

export default router;