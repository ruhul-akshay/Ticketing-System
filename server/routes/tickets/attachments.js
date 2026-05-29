import express from 'express';
import Ticket from '../../models/Ticket.js';
import { authenticate } from '../../middleware/auth.js';
import { upload, isValidObjectId } from './helpers.js';

const router = express.Router();

/* =========================================================
   GET ATTACHMENT METADATA (NO FILE BUFFER)
========================================================= */
router.get('/:ticketId/attachments', authenticate, async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!isValidObjectId(ticketId))
      return res.status(400).json({ message: 'Invalid ticket ID' });

    const ticket = await Ticket.findById(ticketId)
      .select('attachments createdBy department');

    if (!ticket)
      return res.status(404).json({ message: 'Ticket not found' });

    // Permission check
    if (
      req.user.role === 'user' &&
      ticket.createdBy.toString() !== req.user._id.toString()
    )
      return res.status(403).json({ message: 'Access denied' });

    const attachments = ticket.attachments.map(att => ({
      _id: att._id,
      filename: att.filename,
      originalName: att.originalName,
      mimeType: att.mimeType,
      size: att.size,
      uploadedAt: att.uploadedAt
    }));

    res.json({ attachments });

  } catch (err) {
    console.error('GET ATTACHMENTS ERROR:', err);
    res.status(500).json({ message: 'Failed to fetch attachments' });
  }
});


/* =========================================================
   DOWNLOAD ATTACHMENT
========================================================= */
router.get('/:ticketId/attachment/:attachmentId', authenticate, async (req, res) => {
  try {
    const { ticketId, attachmentId } = req.params;

    if (!isValidObjectId(ticketId) || !isValidObjectId(attachmentId))
      return res.status(400).json({ message: 'Invalid ID format' });

    const ticket = await Ticket.findById(ticketId).select('+attachments.data +supportingDocuments.data +adminAttachments.data +remarks.attachments.data');
    if (!ticket)
      return res.status(404).json({ message: 'Ticket not found' });

    let attachment = ticket.attachments.id(attachmentId) || 
                       ticket.supportingDocuments?.id(attachmentId) || 
                       ticket.adminAttachments?.id(attachmentId);

    // Search in remarks
    if (!attachment && ticket.remarks) {
      for (const remark of ticket.remarks) {
        if (remark.attachments) {
          const found = remark.attachments.id(attachmentId);
          if (found) { attachment = found; break; }
        }
      }
    }

    if (!attachment)
      return res.status(404).json({ message: 'Attachment not found' });

    // Permission check
    if (
      req.user.role === 'user' &&
      ticket.createdBy.toString() !== req.user._id.toString()
    )
      return res.status(403).json({ message: 'Access denied' });

    const filename = encodeURIComponent(
      attachment.originalName || attachment.filename
    );

    res.set({
      'Content-Type': attachment.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': attachment.size,
      'Cache-Control': 'private, max-age=3600'
    });

    res.send(attachment.data);

  } catch (err) {
    console.error('DOWNLOAD ATTACHMENT ERROR:', err);
    res.status(500).json({ message: 'Failed to download attachment' });
  }
});


/* =========================================================
   VIEW ATTACHMENT INLINE
========================================================= */
router.get('/:ticketId/view/:attachmentId', authenticate, async (req, res) => {
  try {
    const { ticketId, attachmentId } = req.params;

    if (!isValidObjectId(ticketId) || !isValidObjectId(attachmentId))
      return res.status(400).json({ message: 'Invalid ID format' });

    const ticket = await Ticket.findById(ticketId).select('+attachments.data +supportingDocuments.data +adminAttachments.data +remarks.attachments.data');
    if (!ticket)
      return res.status(404).json({ message: 'Ticket not found' });

    let attachment = ticket.attachments.id(attachmentId) || 
                       ticket.supportingDocuments?.id(attachmentId) || 
                       ticket.adminAttachments?.id(attachmentId);

    // Search in remarks
    if (!attachment && ticket.remarks) {
      for (const remark of ticket.remarks) {
        if (remark.attachments) {
          const found = remark.attachments.id(attachmentId);
          if (found) { attachment = found; break; }
        }
      }
    }

    if (!attachment)
      return res.status(404).json({ message: 'Attachment not found' });

    if (
      req.user.role === 'user' &&
      ticket.createdBy.toString() !== req.user._id.toString()
    )
      return res.status(403).json({ message: 'Access denied' });

    const viewableTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain'
    ];

    const canInline = viewableTypes.includes(attachment.mimeType);

    const filename = encodeURIComponent(
      attachment.originalName || attachment.filename
    );

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
    res.status(500).json({ message: 'Failed to view attachment' });
  }
});


/* =========================================================
   ADD ATTACHMENTS TO EXISTING TICKET
========================================================= */
router.post('/:ticketId/attachments', authenticate, upload.array('attachments', 10), async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!isValidObjectId(ticketId))
      return res.status(400).json({ message: 'Invalid ticket ID' });

    const ticket = await Ticket.findById(ticketId);
    if (!ticket)
      return res.status(404).json({ message: 'Ticket not found' });

    if (
      req.user.role === 'user' &&
      ticket.createdBy.toString() !== req.user._id.toString()
    )
      return res.status(403).json({ message: 'Access denied' });

    if (!req.files?.length)
      return res.status(400).json({ message: 'No files uploaded' });

    const newAttachments = req.files.map(file => ({
      filename: `${Date.now()}-${file.originalname}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      data: file.buffer,
      uploadedAt: new Date()
    }));

    ticket.attachments.push(...newAttachments);
    await ticket.save();

    res.json({
      message: 'Attachments added successfully',
      count: newAttachments.length
    });

  } catch (err) {

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 10MB.'
      });
    }

    console.error('ADD ATTACHMENT ERROR:', err);
    res.status(500).json({ message: 'Failed to add attachments' });
  }
});


/* =========================================================
   DELETE ATTACHMENT
========================================================= */
router.delete('/:ticketId/attachment/:attachmentId', authenticate, async (req, res) => {
  try {
    const { ticketId, attachmentId } = req.params;

    if (!isValidObjectId(ticketId) || !isValidObjectId(attachmentId))
      return res.status(400).json({ message: 'Invalid ID format' });

    const ticket = await Ticket.findById(ticketId);
    if (!ticket)
      return res.status(404).json({ message: 'Ticket not found' });

    if (
      req.user.role === 'user' &&
      ticket.createdBy.toString() !== req.user._id.toString()
    )
      return res.status(403).json({ message: 'Access denied' });

    let attachment = ticket.attachments.id(attachmentId);
    let targetArray = ticket.attachments;

    if (!attachment) {
      attachment = ticket.supportingDocuments?.id(attachmentId);
      targetArray = ticket.supportingDocuments;
    }
    if (!attachment) {
      attachment = ticket.adminAttachments?.id(attachmentId);
      targetArray = ticket.adminAttachments;
    }

    if (!attachment)
      return res.status(404).json({ message: 'Attachment not found' });

    targetArray.pull(attachmentId);
    await ticket.save();

    res.json({
      message: 'Attachment deleted successfully',
      ticketId,
      attachmentId
    });

  } catch (err) {
    console.error('DELETE ATTACHMENT ERROR:', err);
    res.status(500).json({ message: 'Failed to delete attachment' });
  }
});

export default router;