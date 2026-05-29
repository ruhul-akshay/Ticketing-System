import express from 'express';
import Ticket from '../../models/Ticket.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { isValidObjectId } from './helpers.js';

const router = express.Router();

router.delete('/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Invalid ID' });

    const ticket = await Ticket.findByIdAndDelete(req.params.id);

    if (!ticket)
      return res.status(404).json({ message: 'Ticket not found' });

    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

export default router;