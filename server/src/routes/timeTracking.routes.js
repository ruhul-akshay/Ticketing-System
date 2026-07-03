import express from 'express';
import * as timeTrackingController from '../controllers/timeTracking.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/projects', authenticate, timeTrackingController.getProjects);
router.get('/projects/:projectId/tasks', authenticate, timeTrackingController.getTasks);
router.post('/start', authenticate, timeTrackingController.startTracking);
router.post('/stop', authenticate, timeTrackingController.stopTracking);

export default router;
