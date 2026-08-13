import * as notificationService from '../services/notification.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const createNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.createNotification(req.user._id, req.body, req.files);
  res.status(201).json(notification);
});

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.fetchNotifications(req.user._id);
  res.json(result);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markNotificationAsRead(req.user._id, req.params.id);
  res.json(result);
});

export const downloadAttachment = asyncHandler(async (req, res) => {
  const { notificationId, attachmentId } = req.params;
  const attachment = await notificationService.fetchAttachment(req.user._id, notificationId, attachmentId);
  
  const filename = encodeURIComponent(attachment.originalName || attachment.filename);

  res.set({
    'Content-Type': attachment.mimeType || 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': attachment.size,
    'Cache-Control': 'private, max-age=3600'
  });

  res.send(attachment.data);
});
