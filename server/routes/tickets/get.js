import express from 'express';
import Ticket from '../../models/Ticket.js';
import { authenticate } from '../../middleware/auth.js';
import { isValidObjectId } from './helpers.js';

const router = express.Router();

/* ===================== GET ALL TICKETS ===================== */
router.get('/', authenticate, async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'user') {
      query.createdBy = req.user._id;
    }

    if (req.user.role === 'admin' && req.user.department) {
      query.department = req.user.department._id || req.user.department;
    }

    const tickets = await Ticket.find(query)
      .populate([
        { path: 'createdBy', select: 'name email companyName company', populate: { path: 'company', select: 'name' } },
        { path: 'assignedTo', select: 'name email' },
        { path: 'solvedBy', select: 'name email' },
        { path: 'department', select: 'name description categories' },
        { path: 'remarks.addedBy', select: 'name email' }
      ])
      .select('-attachments.data -adminAttachments.data -supportingDocuments.data')
      .sort({ createdAt: -1 });

    const formatted = tickets.map(t => ({
      ...t.toObject(),
      attachmentCount: t.attachments?.length || 0
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load tickets' });
  }
});

/* ===================== GET SINGLE TICKET ===================== */
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Invalid ticket ID' });

    const ticket = await Ticket.findById(req.params.id)
      .populate([
        { path: 'createdBy', select: 'name email companyName company', populate: { path: 'company', select: 'name' } },
        { path: 'assignedTo', select: 'name email' },
        { path: 'solvedBy', select: 'name email' },
        { path: 'department', select: 'name description categories' },
        { path: 'remarks.addedBy', select: 'name email' },
        { path: 'adminAttachments.uploadedBy', select: 'name email' }
      ])
      .select('-attachments.data -adminAttachments.data -supportingDocuments.data');

    if (!ticket)
      return res.status(404).json({ message: 'Ticket not found' });

    if (
      req.user.role === 'user' &&
      ticket.createdBy._id.toString() !== req.user._id.toString()
    )
      return res.status(403).json({ message: 'Access denied' });

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load ticket' });
  }
});

export default router;