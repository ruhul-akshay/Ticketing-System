import express from 'express';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.post('/test', authenticate, (req, res) => {
  res.json({
    message: 'Test successful',
    user: req.user
  });
});

export default router;