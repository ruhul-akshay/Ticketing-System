import express from 'express';
import Ticket from '../../models/Ticket.js';
import { authenticate } from '../../middleware/auth.js';
import { isValidObjectId } from './helpers.js';

const router = express.Router();

router.post('/:id/feedback', authenticate, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Invalid ID' });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket)
      return res.status(404).json({ message: 'Ticket not found' });

    if (ticket.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Access denied' });

    ticket.feedback = {
      rating: req.body.rating,
      comment: req.body.comment,
      submittedAt: new Date()
    };

    await ticket.save();
    res.json(ticket.feedback);
  } catch (err) {
    res.status(500).json({ message: 'Feedback failed' });
  }
});

export default router;