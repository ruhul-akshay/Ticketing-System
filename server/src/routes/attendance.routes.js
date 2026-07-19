import express from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/check-in', authenticate, attendanceController.checkIn);
router.post('/check-out', authenticate, attendanceController.checkOut);
router.get('/summary', authenticate, attendanceController.getMonthlySummary);

router.post('/leaves', authenticate, attendanceController.requestLeave);
router.get('/leaves/my', authenticate, attendanceController.getMyLeaves);

// Super Admin / Admin (Consultant) specific routes for leave management
router.get('/leaves', authenticate, authorize('superadmin', 'admin'), attendanceController.getAllLeaves);
router.patch('/leaves/:id', authenticate, authorize('superadmin', 'admin'), attendanceController.approveLeave);

export default router;
