import express from 'express';
import * as consultantStatsController from '../controllers/consultantStats.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Specific routes first to avoid route collisions
router.get('/me', authenticate, authorize('consultant', 'superadmin'), consultantStatsController.getMyStats);

// General resource routes
router.get('/', authenticate, authorize('superadmin'), consultantStatsController.getAllConsultantsStats);
router.get('/:consultantId', authenticate, authorize('superadmin'), consultantStatsController.getConsultantStats);

export default router;
