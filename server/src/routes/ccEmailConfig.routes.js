import express from 'express';
import * as ccEmailConfigController from '../controllers/ccEmailConfig.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('superadmin'), ccEmailConfigController.getAllConfigs);
router.post('/', authenticate, authorize('superadmin'), ccEmailConfigController.createConfig);
router.put('/:id', authenticate, authorize('superadmin'), ccEmailConfigController.updateConfig);
router.delete('/:id', authenticate, authorize('superadmin'), ccEmailConfigController.deleteConfig);

export default router;
