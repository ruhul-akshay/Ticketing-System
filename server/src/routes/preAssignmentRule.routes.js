import express from 'express';
import * as ruleController from '../controllers/preAssignmentRule.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('superadmin'), ruleController.getRules);
router.post('/', authenticate, authorize('superadmin'), ruleController.createRule);
router.put('/:id', authenticate, authorize('superadmin'), ruleController.updateRule);
router.delete('/:id', authenticate, authorize('superadmin'), ruleController.deleteRule);

export default router;
