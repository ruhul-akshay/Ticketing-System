import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as controller from '../controllers/department.controller.js';

const router = express.Router();

// Department Category Routes
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

// Department Core Routes
router.get('/', authenticate, controller.getDepartments);

router.post(
  '/',
  authenticate,
  authorize('superadmin'),
  controller.createDepartment
);

router.patch(
  '/:id',
  authenticate,
  authorize('superadmin'),
  controller.updateDepartment
);

router.delete(
  '/:id',
  authenticate,
  authorize('superadmin'),
  controller.deleteDepartment
);

export default router;
