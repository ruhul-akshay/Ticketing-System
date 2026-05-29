import express from 'express';
import Ticket from '../../models/Ticket.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { isValidObjectId } from './helpers.js';

const router = express.Router();

router.post('/:id/remarks', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Invalid ID' });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket)
      return res.status(404).json({ message: 'Ticket not found' });

    ticket.remarks.push({
      text: req.body.text,
      addedBy: req.user._id
    });

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add remark' });
  }
});

export default router;