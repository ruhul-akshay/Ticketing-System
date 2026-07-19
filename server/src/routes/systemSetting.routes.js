import express from 'express';
import * as systemSettingController from '../controllers/systemSetting.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, systemSettingController.getSettings);
router.post('/', authenticate, authorize('superadmin', 'super admin'), systemSettingController.updateSetting);

export default router;
