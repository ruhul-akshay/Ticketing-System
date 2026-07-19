import express from 'express';
import * as holidayController from '../controllers/holiday.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('superadmin', 'admin'), holidayController.getHolidays);
router.post('/', authenticate, authorize('superadmin'), holidayController.createHoliday);
router.put('/:id', authenticate, authorize('superadmin'), holidayController.updateHoliday);
router.delete('/:id', authenticate, authorize('superadmin'), holidayController.deleteHoliday);

router.get('/weekend-config', authenticate, authorize('superadmin', 'admin'), holidayController.getWeekendConfig);
router.post('/weekend-config', authenticate, authorize('superadmin'), holidayController.saveWeekendConfig);

router.get('/audit-logs', authenticate, authorize('superadmin', 'admin'), holidayController.getAuditLogs);

export default router;
