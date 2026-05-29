import express from 'express';
import Ticket from '../../models/Ticket.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { isValidObjectId } from './helpers.js';
import { sendTicketResolvedEmail } from '../../utils/email.js';

const router = express.Router();

router.patch('/:id/status', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Invalid ID' });

    const { status, solution } = req.body;

    const ticket = await Ticket.findById(req.params.id).populate({
      path: 'createdBy',
      select: 'name email company companyName'
    });
    if (!ticket)
      return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = status;
    if (solution) ticket.solution = solution;

    let supportWarning = null;

    if (status === 'resolved') {
      const now = new Date();
      ticket.solvedAt = now;
      ticket.solvedBy = req.user._id;
      const msElapsed = now - ticket.createdAt;
      ticket.timeToSolve = msElapsed;

      // --- INCREMENTAL SUPPORT HOURS DEDUCTION ---
      try {
        const companyId = ticket.createdBy?.company;
        if (companyId) {
          const Company = (await import('../../models/Company.js')).default;
          const company = await Company.findById(companyId);
          if (
            company &&
            company.erpDetails?.sapSupportAMCType === 'Limited' &&
            company.erpDetails?.sapSupportHourlyCap > 0
          ) {
            const totalLogged = ticket.workLogs.reduce((acc, log) => acc + (log.hours || 0), 0);
            const alreadyDeducted = ticket.hoursDeducted || 0;
            const toDeduct = parseFloat((totalLogged - alreadyDeducted).toFixed(2));

            if (toDeduct > 0) {
              company.erpDetails.hoursUsed = parseFloat(((company.erpDetails.hoursUsed || 0) + toDeduct).toFixed(2));
              
              ticket.hoursDeducted = parseFloat((alreadyDeducted + toDeduct).toFixed(2));
              await company.save();
              console.log(`Updated hoursUsed by ${toDeduct}h for company ${company.name} via status change.`);
            }
          }
        }
      } catch (deductErr) {
        console.error('Status route deduction failed:', deductErr);
      }
      
      if (ticket.createdBy?.email) {
        sendTicketResolvedEmail(ticket.createdBy.email, ticket)
          .catch(err => console.error(err));
      }
    }

    await ticket.save();
    res.json({ ticket, supportWarning });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Status update failed' });
  }
});

export default router;