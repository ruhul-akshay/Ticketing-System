import * as ticketService from '../services/ticket.service.js';

export const getTickets = async (req, res) => {
  try {
    const formatted = await ticketService.getTickets(req.user);
    res.json(formatted);
  } catch (err) {
    console.error('GET TICKETS ERROR:', err);
    res.status(500).json({ message: 'Failed to load tickets' });
  }
};

export const exportCSV = async (req, res) => {
  try {
    const csvContent = await ticketService.exportTicketsCSV(req.user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=tickets_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export tickets',
      error: error.message
    });
  }
};

export const getTicket = async (req, res) => {
  try {
    const ticket = await ticketService.getTicketById(req.user, req.params.id);
    res.json(ticket);
  } catch (err) {
    console.error('GET TICKET ERROR:', err);
    if (err.message === 'Invalid ticket ID') {
      res.status(400).json({ message: err.message });
    } else if (err.message === 'Ticket not found') {
      res.status(404).json({ message: err.message });
    } else if (err.message.includes('Access denied')) {
      res.status(403).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Failed to load ticket' });
    }
  }
};

export const createTicket = async (req, res) => {
  try {
    const ticketObj = await ticketService.createTicket(req.user, req.body, req.files);
    res.status(201).json(ticketObj);
  } catch (err) {
    console.error('CREATE TICKET ERROR:', err);
    if (err.message.includes('required')) {
      res.status(400).json({ message: err.message });
    } else if (err.message === 'Unauthorized') {
      res.status(401).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

export const createTicketJson = async (req, res) => {
  try {
    const ticketObj = await ticketService.createTicket(req.user, req.body, {});
    res.status(201).json(ticketObj);
  } catch (err) {
    console.error('CREATE TICKET JSON ERROR:', err);
    if (err.message.includes('required')) {
      res.status(400).json({ message: err.message });
    } else if (err.message === 'Unauthorized') {
      res.status(401).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

export const updateTicket = async (req, res) => {
  try {
    const ticket = await ticketService.updateTicket(req.user, req.params.id, req.body, req.files);
    res.json(ticket);
  } catch (err) {
    console.error('UPDATE TICKET ERROR:', err);
    if (err.message === 'Invalid ticket ID') {
      res.status(400).json({ message: err.message });
    } else if (err.message === 'Ticket not found') {
      res.status(404).json({ message: err.message });
    } else if (err.message === 'Permission denied' || err.message.includes('Access denied')) {
      res.status(403).json({ message: err.message });
    } else if (err.message.includes('required') || err.message.includes('only add messages')) {
      res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Failed to update ticket' });
    }
  }
};

export const deleteTicket = async (req, res) => {
  try {
    await ticketService.deleteTicket(req.params.id);
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    console.error('DELETE TICKET ERROR:', err);
    if (err.message === 'Invalid ID') {
      res.status(400).json({ message: err.message });
    } else if (err.message === 'Ticket not found') {
      res.status(404).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Delete failed' });
    }
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const feedback = await ticketService.submitFeedback(req.user, req.params.id, req.body.rating, req.body.comment);
    res.json(feedback);
  } catch (err) {
    console.error('FEEDBACK ERROR:', err);
    if (err.message === 'Invalid ID') {
      res.status(400).json({ message: err.message });
    } else if (err.message === 'Ticket not found') {
      res.status(404).json({ message: err.message });
    } else if (err.message === 'Access denied') {
      res.status(403).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Feedback failed' });
    }
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await ticketService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error('GET STATS ERROR:', err);
    res.status(500).json({ message: 'Stats failed' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const result = await ticketService.updateTicketStatusPatch(req.user, req.params.id, req.body);
    res.json(result);
  } catch (err) {
    console.error('PATCH STATUS ERROR:', err);
    if (err.message === 'Invalid ID') {
      res.status(400).json({ message: err.message });
    } else if (err.message === 'Ticket not found') {
      res.status(404).json({ message: err.message });
    } else if (err.message.includes('Access denied')) {
      res.status(403).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Status update failed' });
    }
  }
};

export const addRemark = async (req, res) => {
  try {
    const ticket = await ticketService.addRemarkOnly(req.user, req.params.id, req.body.text, req.body.isInternal);
    res.json(ticket);
  } catch (err) {
    console.error('ADD REMARK ERROR:', err);
    if (err.message === 'Invalid ID') {
      res.status(400).json({ message: err.message });
    } else if (err.message === 'Ticket not found') {
      res.status(404).json({ message: err.message });
    } else if (err.message.includes('Access denied')) {
      res.status(403).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Failed to add remark' });
    }
  }
};

export const assignTicket = async (req, res) => {
  try {
    const consultantId = req.body.consultantId || req.body.adminId;
    const ccConsultantIds = req.body.ccConsultantIds || req.body.ccConsultants || [];
    const ticket = await ticketService.assignTicket(req.user, req.params.id, consultantId, req.body.remarks, ccConsultantIds);
    res.json(ticket);
  } catch (err) {
    console.error('ASSIGN ERROR:', err);
    if (err.message.includes('Only Super Admin')) {
      res.status(403).json({ message: err.message });
    } else if (err.message.includes('Invalid') || err.message.includes('not a Consultant') || err.message.includes('not an Admin')) {
      res.status(400).json({ message: err.message });
    } else if (err.message === 'Ticket not found.') {
      res.status(404).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Failed to assign ticket.' });
    }
  }
};

export const forwardTicket = async (req, res) => {
  try {
    const consultantId = req.body.consultantId || req.body.adminId;
    const ccConsultantIds = req.body.ccConsultantIds || req.body.ccConsultants || [];
    const ticket = await ticketService.forwardTicket(req.user, req.params.id, consultantId, req.body.remarks, ccConsultantIds);
    res.json(ticket);
  } catch (err) {
    console.error('FORWARD ERROR:', err);
    if (err.message.includes('Only Consultants') || err.message.includes('Only Admins') || err.message.includes('Only the currently assigned')) {
      res.status(403).json({ message: err.message });
    } else if (err.message.includes('Invalid') || err.message.includes('not a Consultant') || err.message.includes('not an Admin')) {
      res.status(400).json({ message: err.message });
    } else if (err.message === 'Ticket not found.') {
      res.status(404).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Failed to forward ticket.' });
    }
  }
};

export const getAttachments = async (req, res) => {
  try {
    const attachments = await ticketService.getAttachments(req.user, req.params.ticketId);
    res.json({ attachments });
  } catch (err) {
    console.error('GET ATTACHMENTS ERROR:', err);
    if (err.message === 'Invalid ticket ID') {
      res.status(400).json({ message: err.message });
    } else if (err.message === 'Ticket not found') {
      res.status(404).json({ message: err.message });
    } else if (err.message.includes('Access denied')) {
      res.status(403).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch attachments' });
    }
  }
};

export const downloadAttachment = async (req, res) => {
  try {
    const attachment = await ticketService.downloadAttachment(req.user, req.params.ticketId, req.params.attachmentId);
    const filename = encodeURIComponent(attachment.originalName || attachment.filename);

    res.set({
      'Content-Type': attachment.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': attachment.size,
      'Cache-Control': 'private, max-age=3600'
    });

    res.send(attachment.data);
  } catch (err) {
    console.error('DOWNLOAD ATTACHMENT ERROR:', err);
    if (err.message.includes('Invalid ID')) {
      res.status(400).json({ message: err.message });
    } else if (err.message === 'Ticket not found' || err.message === 'Attachment not found') {
      res.status(404).json({ message: err.message });
    } else if (err.message.includes('Access denied')) {
      res.status(403).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Failed to download attachment' });
    }
  }
};

export const viewAttachmentInline = async (req, res) => {
  try {
    const attachment = await ticketService.downloadAttachment(req.user, req.params.ticketId, req.params.attachmentId);
    
    const viewableTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain'
    ];

    const canInline = viewableTypes.includes(attachment.mimeType);
    const filename = encodeURIComponent(attachment.originalName || attachment.filename);

    res.set({
      'Content-Type': attachment.mimeType || 'application/octet-stream',
      'Content-Disposition': canInline
        ? `inline; filename="${filename}"`
        : `attachment; filename="${filename}"`,
      'Content-Length': attachment.size,
      'Cache-Control': 'private, max-age=3600'
    });

    res.send(attachment.data);
  } catch (err) {
    console.error('VIEW ATTACHMENT ERROR:', err);
    if (err.message.includes('Invalid ID')) {
      res.status(400).json({ message: err.message });
    } else if (err.message === 'Ticket not found' || err.message === 'Attachment not found') {
      res.status(404).json({ message: err.message });
    } else if (err.message.includes('Access denied')) {
      res.status(403).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Failed to view attachment' });
    }
  }
};

export const addAttachments = async (req, res) => {
  try {
    const count = await ticketService.addAttachmentsToTicket(req.user, req.params.ticketId, req.files);
    res.json({
      message: 'Attachments added successfully',
      count
    });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    console.error('ADD ATTACHMENT ERROR:', err);
    if (err.message === 'Invalid ticket ID') {
      res.status(400).json({ message: err.message });
    } else if (err.message === 'Ticket not found') {
      res.status(404).json({ message: err.message });
    } else if (err.message.includes('Access denied')) {
      res.status(403).json({ message: err.message });
    } else if (err.message.includes('No files')) {
      res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Failed to add attachments' });
    }
  }
};

export const deleteAttachment = async (req, res) => {
  try {
    await ticketService.deleteAttachmentFromTicket(req.user, req.params.ticketId, req.params.attachmentId);
    res.json({
      message: 'Attachment deleted successfully',
      ticketId: req.params.ticketId,
      attachmentId: req.params.attachmentId
    });
  } catch (err) {
    console.error('DELETE ATTACHMENT ERROR:', err);
    if (err.message.includes('Invalid ID')) {
      res.status(400).json({ message: err.message });
    } else if (err.message === 'Ticket not found' || err.message === 'Attachment not found') {
      res.status(404).json({ message: err.message });
    } else if (err.message.includes('Access denied')) {
      res.status(403).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Failed to delete attachment' });
    }
  }
};

export const testTicketRoute = (req, res) => {
  res.json({
    message: 'Test successful',
    user: req.user
  });
};
