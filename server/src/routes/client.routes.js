import express from 'express';
import * as clientController from '../controllers/client.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Specific routes first to avoid route collisions
router.get('/my-client', authenticate, clientController.getMyClient);
router.get('/stats/overview', authenticate, authorize('superadmin'), clientController.getStatsOverview);
router.get('/erp/types', authenticate, authorize('superadmin'), clientController.getERPTypes);
router.get('/search/names', authenticate, authorize('superadmin'), clientController.searchClientNames);
router.post('/bulk/status', authenticate, authorize('superadmin'), clientController.bulkUpdateStatus);
router.get('/export/csv', authenticate, authorize('superadmin'), clientController.exportCSV);
router.post('/refresh', authenticate, authorize('superadmin'), clientController.refreshAnalytics);

// General resource routes
router.get('/', authenticate, clientController.getClients);
router.post('/', authenticate, authorize('superadmin'), clientController.createClient);

router.get('/:id', authenticate, authorize('superadmin'), clientController.getClient);
router.put('/:id', authenticate, authorize('superadmin'), clientController.updateClientPut);
router.patch('/:id', authenticate, authorize('superadmin'), clientController.updateClientPatch);
router.delete('/:id', authenticate, authorize('superadmin'), clientController.deleteClient);

router.post('/:id/renew', authenticate, authorize('superadmin'), clientController.renewSupport);

export default router;
