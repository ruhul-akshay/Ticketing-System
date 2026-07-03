import express from 'express';

import authRoutes from './auth.routes.js';
import clientUserRoutes from './clientUser.routes.js';
import clientRoutes from './client.routes.js';
import consultantProfileRoutes from './consultantProfile.routes.js';
import consultantStatsRoutes from './consultantStats.routes.js';
import ticketRoutes from './ticket.routes.js';
import timeTrackingRoutes from './timeTracking.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import departmentRoutes from './departments/department.routes.js';
import notificationRoutes from './notifications/notification.routes.js';
import preAssignmentRuleRoutes from './preAssignmentRule.routes.js';
import ccEmailConfigRoutes from './ccEmailConfig.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/client-users', clientUserRoutes);
router.use('/clients', clientRoutes);
router.use('/consultant-profiles', consultantProfileRoutes);
router.use('/consultant-stats', consultantStatsRoutes);
router.use('/tickets', ticketRoutes);
router.use('/time-tracking', timeTrackingRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/departments', departmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/pre-assignment-rules', preAssignmentRuleRoutes);
router.use('/cc-emails', ccEmailConfigRoutes);

export default router;
