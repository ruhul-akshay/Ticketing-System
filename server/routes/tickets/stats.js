import express from 'express';
import Ticket from '../../models/Ticket.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

/* ============================================================
   GET /api/tickets/dashboard/stats
   Returns: total, pending, resolved, avgResolutionTime (min), avgRating
   Used by: SuperAdminDashboard, AdminDashboard
============================================================ */
router.get('/dashboard/stats', authenticate, async (req, res) => {
  try {
    const tickets = await Ticket.find({}, 'status timeToSolve feedback');

    const total = tickets.length;
    const pending = tickets.filter(t => t.status?.toLowerCase() === 'pending').length;
    const resolved = tickets.filter(t => t.status?.toLowerCase() === 'resolved').length;

    // Avg resolution time in MINUTES (with fallback for legacy tickets missing timeToSolve)
    const resolvedTickets = tickets.filter(t => t.status?.toLowerCase() === 'resolved');
    const totalMs = resolvedTickets.reduce((sum, t) => {
      let duration = t.timeToSolve;
      if (!duration || duration <= 0) {
        const endTime = t.actualResolutionDate || t.solvedAt || t.updatedAt || new Date();
        duration = new Date(endTime).getTime() - new Date(t.createdAt).getTime();
      }
      return sum + Math.max(0, duration);
    }, 0);

    const avgResolutionTime = resolvedTickets.length > 0
      ? (totalMs / resolvedTickets.length) / 60000
      : 0;

    // Avg rating from feedback
    const ratedTickets = tickets.filter(t => t.feedback?.rating > 0);
    const avgRating = ratedTickets.length > 0
      ? ratedTickets.reduce((sum, t) => sum + t.feedback.rating, 0) / ratedTickets.length
      : 0;

    res.json({
      total,
      pending,
      resolved,
      avgResolutionTime: +avgResolutionTime.toFixed(1), // minutes
      avgRating: +avgRating.toFixed(2),
      totalRatings: ratedTickets.length
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Stats failed' });
  }
});

export default router;