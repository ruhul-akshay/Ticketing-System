import express from 'express';

import createRoutes from './create.js';
import getRoutes from './get.js';
import updateRoutes from './update.js';
import deleteRoutes from './delete.js';
import statusRoutes from './status.js';
import remarksRoutes from './remarks.js';
import attachmentRoutes from './attachments.js';
// import adminAttachmentRoutes from './adminAttachments.js';
import feedbackRoutes from './feedback.js';
import statsRoutes from './stats.js';
import testRoutes from './test.js';

const router = express.Router();

router.use('/', createRoutes);
router.use('/', getRoutes);
router.use('/', updateRoutes);
router.use('/', deleteRoutes);
router.use('/', statusRoutes);
router.use('/', remarksRoutes);
router.use('/', attachmentRoutes);
// router.use('/', adminAttachmentRoutes);
router.use('/', feedbackRoutes);
router.use('/', statsRoutes);
router.use('/', testRoutes);

export default router;