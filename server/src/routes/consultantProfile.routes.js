import express from 'express';
import * as consultantProfileController from '../controllers/consultantProfile.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(consultantProfileController.logAccess);

// Specific routes first to avoid route collisions
router.get('/my-profile', authenticate, authorize('consultant'), consultantProfileController.getMyProfile);
router.patch('/my-profile', authenticate, authorize('consultant'), consultantProfileController.updateMyProfile);
router.get('/search', authenticate, authorize('superadmin', 'consultant'), consultantProfileController.searchProfiles);
router.get('/by-department/:departmentId', authenticate, authorize('superadmin', 'consultant'), consultantProfileController.getConsultantProfilesByDept);

// General resource routes
router.get('/', authenticate, authorize('superadmin', 'consultant'), consultantProfileController.getConsultantProfiles);
router.post('/', authenticate, authorize('superadmin'), consultantProfileController.createProfile);

router.get('/:id', authenticate, consultantProfileController.getConsultantProfile);
router.patch('/:id/limited', authenticate, authorize('superadmin', 'consultant'), consultantProfileController.updateLimitedProfile);
router.patch('/:id', authenticate, authorize('superadmin'), consultantProfileController.updateProfile);
router.delete('/:id', authenticate, authorize('superadmin'), consultantProfileController.deleteProfile);

export default router;
