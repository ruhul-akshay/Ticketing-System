import express from 'express';
import Ticket from '../../models/Ticket.js';
import { authenticate } from '../../middleware/auth.js';
import { upload, isValidObjectId } from './helpers.js';
import { sendTicketResolvedEmail } from '../../utils/email.js';

const router = express.Router();

router.put('/:id', authenticate, upload.fields([{ name: 'attachments', maxCount: 10 }, { name: 'supportingDocuments', maxCount: 10 }, { name: 'adminAttachments', maxCount: 10 }, { name: 'remarkAttachments', maxCount: 10 }]), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id))
      return res.status(400).json({ message: 'Invalid ticket ID' });

    const ticket = await Ticket.findById(id).populate([
      { path: 'createdBy', select: 'name email company companyName' },
      { path: 'department', select: 'name' }
    ]);
    if (!ticket)
      return res.status(404).json({ message: 'Ticket not found' });

    const creatorId = ticket.createdBy._id || ticket.createdBy;
    const isCreator = creatorId.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    if (!isCreator && !isAdmin)
      return res.status(403).json({ message: 'Permission denied' });

    if (req.user.role === 'user' && ticket.status !== 'pending')
      return res.status(400).json({ message: 'Only pending tickets can be edited' });

    // Handle workLogs (array) and legacy workLog (single) separately so they append
    const { workLog, workLogs, remarks, solution, ...restBody } = req.body;
    
    // Enforcement: Cannot resolve without a solution
    if (restBody.status === 'resolved' && (!solution || solution.trim().length === 0) && !ticket.solution) {
      return res.status(400).json({ message: "A written 'solution' is required to mark a ticket as resolved." });
    }

    Object.assign(ticket, { ...restBody, solution });

    // If 'remarks' is a string, add it as a new remark entry
    if (remarks && typeof remarks === 'string' && remarks.trim().length > 0) {
      ticket.remarks.push({
        text: remarks,
        addedBy: req.user._id,
        addedAt: new Date()
      });
    }

    // Parse a single workLog entry (legacy / backward compat)
    let parsedWorkLog = workLog;
    if (typeof workLog === 'string') {
      try { parsedWorkLog = JSON.parse(workLog); } catch (e) { parsedWorkLog = null; }
    }

    // Parse workLogs array (new multi-entry support)
    let parsedWorkLogs = workLogs;
    if (typeof workLogs === 'string') {
      try { parsedWorkLogs = JSON.parse(workLogs); } catch (e) { parsedWorkLogs = null; }
    }

    if (!ticket.workLogs) ticket.workLogs = [];

    // Push single entry (legacy)
    if (parsedWorkLog && parsedWorkLog.date && parsedWorkLog.hours) {
      ticket.workLogs.push({ ...parsedWorkLog, hours: Number(parsedWorkLog.hours), addedBy: req.user._id });
    }

    // Push multiple entries (new)
    if (Array.isArray(parsedWorkLogs) && parsedWorkLogs.length > 0) {
      parsedWorkLogs.forEach(log => {
        if (log.date && log.hours) {
          ticket.workLogs.push({ date: log.date, hours: Number(log.hours), addedBy: req.user._id });
        }
      });
    }

    if (ticket.status === 'resolved') {
      const isFirstResolve = !ticket.timeToSolve;

      if (ticket.workLogs && ticket.workLogs.length > 0) {
        const totalHours = ticket.workLogs.reduce((acc, log) => acc + (log.hours || 0), 0);
        ticket.timeToSolve = totalHours * 60 * 60 * 1000;
      } else if (isFirstResolve) {
        ticket.timeToSolve = new Date(ticket.actualResolutionDate || ticket.solvedAt || Date.now()).getTime() - ticket.createdAt.getTime();
      }

      if (!ticket.solvedBy) ticket.solvedBy = req.user._id;

      // --- SUPPORT HOURS DEDUCTION (INCREMENTAL) ---
      // Deduct newly added hours whenever ticket is 'resolved'
      if (ticket.status === 'resolved') {
        try {
          const freshTicket = await Ticket.findById(ticket._id).populate({ path: 'createdBy', select: 'company' });
          const companyId = freshTicket?.createdBy?.company;
          
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
                // Track total used hours on company
                company.erpDetails.hoursUsed = parseFloat(((company.erpDetails.hoursUsed || 0) + toDeduct).toFixed(2));
                
                // Update ticket's deduction tracker
                ticket.hoursDeducted = parseFloat((alreadyDeducted + toDeduct).toFixed(2));
                
                await company.save();
                console.log(`Updated hoursUsed by ${toDeduct}h for company ${company.name}. Total deducted for this ticket: ${ticket.hoursDeducted}h`);
              }
            }
          }
        } catch (deductErr) {
          console.error('Incremental support hours deduction failed:', deductErr);
        }

        // --- RESOLUTION EMAIL ---
        // Only send if it was just resolved (timeToSolve was just set)
        if (!ticket.timeToSolve && ticket.createdBy?.email) {
           sendTicketResolvedEmail(ticket.createdBy.email, ticket)
            .catch(err => console.error('RESOLVED EMAIL ERROR:', err.message));
        }
      }
    }

    if (req.files) {
      const processFiles = (fileArray) => fileArray?.map(file => ({
        filename: `${Date.now()}-${file.originalname}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        data: file.buffer,
        uploadedAt: new Date()
      })) || [];

      const newAttachments = processFiles(req.files.attachments);
      if (newAttachments.length) ticket.attachments.push(...newAttachments);

      const newSupportingDocs = processFiles(req.files.supportingDocuments);
      if (newSupportingDocs.length) ticket.supportingDocuments.push(...newSupportingDocs);

      const newAdminAttachments = processFiles(req.files.adminAttachments);
      if (newAdminAttachments.length) ticket.adminAttachments.push(...newAdminAttachments);

      // Handle files for the NEW remark being added
      const newRemarkAttachments = processFiles(req.files.remarkAttachments);
      if (newRemarkAttachments.length && ticket.remarks.length > 0) {
        // Attach these files to the LAST remark added in this request (which we just pushed above)
        const lastRemark = ticket.remarks[ticket.remarks.length - 1];
        lastRemark.attachments = newRemarkAttachments;
      }
    }

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update ticket' });
  }
});

export default router;