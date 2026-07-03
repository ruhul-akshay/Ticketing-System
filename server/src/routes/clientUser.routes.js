import express from 'express';
import * as clientUserController from '../controllers/clientUser.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Specific routes first
router.get('/profile', authenticate, clientUserController.getProfile);
router.patch('/profile/password', authenticate, clientUserController.updateOwnPassword);
router.get('/stats/overview', authenticate, authorize('superadmin', 'consultant', 'clientuser'), clientUserController.getUserStats);
router.get('/role/:role', authenticate, authorize('superadmin', 'consultant', 'clientuser'), clientUserController.getUsersByRole);

// General resource routes
router.get('/', authenticate, authorize('superadmin', 'consultant', 'clientuser'), clientUserController.getUsers);
router.post('/', authenticate, authorize('superadmin', 'consultant', 'clientuser'), clientUserController.createUser);

router.get('/:id', authenticate, clientUserController.getUser);
router.put('/:id', authenticate, clientUserController.updateUser);
router.delete('/:id', authenticate, authorize('superadmin', 'clientuser'), clientUserController.deleteUser);

router.patch('/:id/status', authenticate, authorize('superadmin', 'consultant', 'clientuser'), clientUserController.updateUserStatus);
router.post('/:id/reset-password', authenticate, authorize('superadmin', 'consultant', 'clientuser'), clientUserController.resetUserPassword);

export default router;
