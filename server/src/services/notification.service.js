import Notification from '../models/Notification.js';
import ClientUser from '../models/ClientUser.js';
import { AppError } from '../utils/AppError.js';

export const createNotification = async (userId, data, files) => {
  const { title, message, targetType, targetId } = data;
  
  let targetModel = null;
  if (targetType === 'department') targetModel = 'Department';
  if (targetType === 'client') targetModel = 'Client';

  const processFiles = (fileArray) => fileArray?.map(file => ({
    filename: `${Date.now()}-${file.originalname}`,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    data: file.buffer,
    uploadedAt: new Date()
  })) || [];

  const attachments = processFiles(files);

  const notification = await Notification.create({
    title,
    message,
    targetType,
    targetId: targetId || null,
    targetModel,
    attachments,
    createdBy: userId
  });

  const notifObj = notification.toObject();
  if (notifObj.attachments) {
    notifObj.attachments.forEach(a => delete a.data);
  }

  return notifObj;
};

export const fetchNotifications = async (userId) => {
  const user = await ClientUser.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const conditions = [{ targetType: 'all' }];
  
  if (user.department) {
    conditions.push({ targetType: 'department', targetId: user.department });
  }
  
  if (user.client) {
    conditions.push({ targetType: 'client', targetId: user.client });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const notifications = await Notification.find({
    $or: conditions,
    createdAt: { $gte: thirtyDaysAgo }
  }).sort({ createdAt: -1 });

  const readSet = new Set(user.readNotifications.map(id => id.toString()));

  return notifications.map(notif => ({
    ...notif.toObject(),
    read: readSet.has(notif._id.toString())
  }));
};

export const markNotificationAsRead = async (userId, notificationId) => {
  await ClientUser.findByIdAndUpdate(userId, {
    $addToSet: { readNotifications: notificationId }
  });
  return { success: true };
};

export const fetchAttachment = async (userId, notificationId, attachmentId) => {
  const notification = await Notification.findById(notificationId).select('+attachments.data');
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  const attachment = notification.attachments.id(attachmentId);
  if (!attachment) {
    throw new AppError('Attachment not found', 404);
  }

  const user = await ClientUser.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  let hasAccess = false;
  if (user.role === 'superadmin' || user.role === 'Super Admin') {
    hasAccess = true;
  } else {
    if (notification.targetType === 'all') {
      hasAccess = true;
    } else if (notification.targetType === 'department' && user.department && String(user.department) === String(notification.targetId)) {
      hasAccess = true;
    } else if (notification.targetType === 'client' && user.client && String(user.client) === String(notification.targetId)) {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    throw new AppError('Access denied', 403);
  }

  return attachment;
};
