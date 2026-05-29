import express from 'express';
import Ticket from '../../models/Ticket.js';
import { authenticate } from '../../middleware/auth.js';
import { upload, generateTicketNumber, isValidObjectId } from './helpers.js';
import { sendTicketCreatedEmail, sendAdminTicketAlertEmail } from '../../utils/email.js';
import Company from '../../models/Company.js';

const router = express.Router();

/* ===================== CREATE (FORM DATA) ===================== */
router.post('/', authenticate, upload.fields([{ name: 'attachments', maxCount: 10 }, { name: 'supportingDocuments', maxCount: 10 }, { name: 'adminAttachments', maxCount: 10 }]), async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      title,
      description,
      priority = 'medium',
      department,
      category,
      reason
    } = req.body;

    if (!title?.trim())
      return res.status(400).json({ message: 'Title is required' });

    if (!description?.trim())
      return res.status(400).json({ message: 'Description is required' });

    if (!department)
      return res.status(400).json({ message: 'Department is required' });

    const departmentId = isValidObjectId(department) ? department : null;
    const ticketNumber = await generateTicketNumber(departmentId);

    const processFiles = (fileArray) => fileArray?.map(file => ({
      filename: `${Date.now()}-${file.originalname}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      data: file.buffer,
      uploadedAt: new Date()
    })) || [];

    const attachments = processFiles(req.files?.attachments);
    const supportingDocuments = processFiles(req.files?.supportingDocuments);
    const adminAttachments = processFiles(req.files?.adminAttachments);

    const ticket = await Ticket.create({
      ticketNumber,
      type: 'ticket',
      title: title.trim(),
      description: description.trim(),
      category: category || null,
      reason: reason || null,
      attachments,
      supportingDocuments,
      adminAttachments,
      priority,
      department: departmentId,
      createdBy: ['admin', 'superadmin'].includes(req.user.role) && req.body.createdBy ? req.body.createdBy : req.user._id,
      status: 'pending'
    });

    await ticket.populate([
      { path: 'createdBy', populate: { path: 'company' } },
      { path: 'department' }
    ]);

    if (ticket.createdBy?.email) {
      const companyContactEmail = ticket.createdBy?.company?.contactEmail || null;
      sendTicketCreatedEmail(ticket.createdBy.email, ticket, companyContactEmail)
        .catch(err => console.error('USER EMAIL ERROR:', err.message));
    }

    // Also notify admins
    sendAdminTicketAlertEmail(ticket)
      .catch(err => console.error('ADMIN EMAIL ERROR:', err.message));

    const ticketObj = ticket.toObject();
    if (ticketObj.attachments) ticketObj.attachments.forEach(a => delete a.data);
    if (ticketObj.supportingDocuments) ticketObj.supportingDocuments.forEach(a => delete a.data);
    if (ticketObj.adminAttachments) ticketObj.adminAttachments.forEach(a => delete a.data);

    res.status(201).json(ticketObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/* ===================== CREATE (JSON) ===================== */
router.post('/json', authenticate, async (req, res) => {
  try {
    if (!req.user?._id)
      return res.status(401).json({ message: 'Unauthorized' });

    const {
      title,
      description,
      priority = 'medium',
      department,
      category,
      reason,
      attachments = [],
      supportingDocuments = [],
      adminAttachments = []
    } = req.body;

    if (!title?.trim())
      return res.status(400).json({ message: 'Title is required' });

    if (!description?.trim())
      return res.status(400).json({ message: 'Description is required' });

    if (!department)
      return res.status(400).json({ message: 'Department is required' });

    const departmentId = isValidObjectId(department) ? department : null;
    const ticketNumber = await generateTicketNumber(departmentId);

    const ticket = await Ticket.create({
      ticketNumber,
      type: 'ticket',
      title: title.trim(),
      description: description.trim(),
      category,
      reason,
      attachments,
      supportingDocuments,
      adminAttachments,
      priority,
      department: departmentId,
      createdBy: ['admin', 'superadmin'].includes(req.user.role) && req.body.createdBy ? req.body.createdBy : req.user._id,
      status: 'pending'
    });

    await ticket.populate([
      { path: 'createdBy', populate: { path: 'company' } },
      { path: 'department' }
    ]);

    if (ticket.createdBy?.email) {
      const companyContactEmail = ticket.createdBy?.company?.contactEmail || null;
      sendTicketCreatedEmail(ticket.createdBy.email, ticket, companyContactEmail)
        .catch(err => console.error('USER EMAIL ERROR:', err.message));
    }

    // Also notify admins
    sendAdminTicketAlertEmail(ticket)
      .catch(err => console.error('ADMIN EMAIL ERROR:', err.message));

    const ticketObj = ticket.toObject();
    if (ticketObj.attachments) ticketObj.attachments.forEach(a => delete a.data);
    if (ticketObj.supportingDocuments) ticketObj.supportingDocuments.forEach(a => delete a.data);
    if (ticketObj.adminAttachments) ticketObj.adminAttachments.forEach(a => delete a.data);

    res.status(201).json(ticketObj);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;