import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import * as controller from './department.controller.js';
import categoryRoutes from './department.category.routes.js';

const router = express.Router();

// Mount categories sub-router
router.use('/', categoryRoutes);

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