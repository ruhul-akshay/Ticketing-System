import * as ticketService from '../services/ticket.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getTickets = asyncHandler(async (req, res) => {
  const formatted = await ticketService.getTickets(req.user);
  res.json(formatted);
});

export const exportCSV = asyncHandler(async (req, res) => {
  const csvContent = await ticketService.exportTicketsCSV(req.user, req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=tickets_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csvContent);
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicketById(req.user, req.params.id);
  res.json(ticket);
});

export const createTicket = asyncHandler(async (req, res) => {
  const ticketObj = await ticketService.createTicket(req.user, req.body, req.files);
  res.status(201).json(ticketObj);
});

export const createTicketJson = asyncHandler(async (req, res) => {
  const ticketObj = await ticketService.createTicket(req.user, req.body, {});
  res.status(201).json(ticketObj);
});

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicket(req.user, req.params.id, req.body, req.files);
  res.json(ticket);
});

export const deleteTicket = asyncHandler(async (req, res) => {
  await ticketService.deleteTicket(req.params.id);
  res.json({ message: 'Ticket deleted' });
});

export const submitFeedback = asyncHandler(async (req, res) => {
  const feedback = await ticketService.submitFeedback(req.user, req.params.id, req.body.rating, req.body.comment);
  res.json(feedback);
});

export const getStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await ticketService.getDashboardStats({ startDate, endDate });
  res.json(stats);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const result = await ticketService.updateTicketStatusPatch(req.user, req.params.id, req.body);
  res.json(result);
});

export const addRemark = asyncHandler(async (req, res) => {
  const ticket = await ticketService.addRemarkOnly(req.user, req.params.id, req.body.text, req.body.isInternal);
  res.json(ticket);
});

export const assignTicket = asyncHandler(async (req, res) => {
  const consultantId = req.body.consultantId || req.body.adminId;
  const ccConsultantIds = req.body.ccConsultantIds || req.body.ccConsultants || [];
  const ticket = await ticketService.assignTicket(req.user, req.params.id, consultantId, req.body.remarks, ccConsultantIds);
  res.json(ticket);
});

export const forwardTicket = asyncHandler(async (req, res) => {
  const consultantId = req.body.consultantId || req.body.adminId;
  const ccConsultantIds = req.body.ccConsultantIds || req.body.ccConsultants || [];
  const ticket = await ticketService.forwardTicket(req.user, req.params.id, consultantId, req.body.remarks, ccConsultantIds);
  res.json(ticket);
});

export const getAttachments = asyncHandler(async (req, res) => {
  const attachments = await ticketService.getAttachments(req.user, req.params.ticketId);
  res.json({ attachments });
});

export const downloadAttachment = asyncHandler(async (req, res) => {
  const attachment = await ticketService.downloadAttachment(req.user, req.params.ticketId, req.params.attachmentId);
  const filename = encodeURIComponent(attachment.originalName || attachment.filename);

  res.set({
    'Content-Type': attachment.mimeType || 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': attachment.size,
    'Cache-Control': 'private, max-age=3600'
  });

  res.send(attachment.data);
});

export const viewAttachmentInline = asyncHandler(async (req, res) => {
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
});

export const addAttachments = asyncHandler(async (req, res) => {
  const count = await ticketService.addAttachmentsToTicket(req.user, req.params.ticketId, req.files);
  res.json({
    message: 'Attachments added successfully',
    count
  });
});

export const deleteAttachment = asyncHandler(async (req, res) => {
  await ticketService.deleteAttachmentFromTicket(req.user, req.params.ticketId, req.params.attachmentId);
  res.json({
    message: 'Attachment deleted successfully',
    ticketId: req.params.ticketId,
    attachmentId: req.params.attachmentId
  });
});

export const markAsOpened = asyncHandler(async (req, res) => {
  const result = await ticketService.markTicketAsOpened(req.user, req.params.id);
  res.json(result);
});

export const testTicketRoute = (req, res) => {
  res.json({
    message: 'Test successful',
    user: req.user
  });
};

export const updateWorkLog = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateWorkLog(req.params.id, req.params.logId, req.body, req.user);
  res.json({ message: 'Work log updated successfully', ticket });
});

export const deleteWorkLog = asyncHandler(async (req, res) => {
  const ticket = await ticketService.deleteWorkLog(req.params.id, req.params.logId, req.user);
  res.json({ message: 'Work log deleted successfully', ticket });
});
