import Notification from '../../models/Notification.js';
import ClientUser from '../../models/ClientUser.js';

export const createNotification = async (req, res) => {
  try {
    const { title, message, targetType, targetId } = req.body;
    
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

    const attachments = processFiles(req.files);

    const notification = await Notification.create({
      title,
      message,
      targetType,
      targetId: targetId || null,
      targetModel,
      attachments,
      createdBy: req.user._id
    });

    const notifObj = notification.toObject();
    if (notifObj.attachments) {
      notifObj.attachments.forEach(a => delete a.data);
    }

    res.status(201).json(notifObj);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create notification', error: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const user = await ClientUser.findById(req.user._id);

    // Build the query
    const conditions = [{ targetType: 'all' }];
    
    if (user.department) {
      conditions.push({ targetType: 'department', targetId: user.department });
    }
    
    if (user.client) {
      conditions.push({ targetType: 'client', targetId: user.client });
    }

    // Limit to past 30 days to optimize
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const notifications = await Notification.find({
      $or: conditions,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 });

    const readSet = new Set(user.readNotifications.map(id => id.toString()));

    const result = notifications.map(notif => ({
      ...notif.toObject(),
      read: readSet.has(notif._id.toString())
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    await ClientUser.findByIdAndUpdate(req.user._id, {
      $addToSet: { readNotifications: id }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as read', error: error.message });
  }
};

export const downloadAttachment = async (req, res) => {
  try {
    const { notificationId, attachmentId } = req.params;
    
    const notification = await Notification.findById(notificationId).select('+attachments.data');
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const attachment = notification.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const user = await ClientUser.findById(req.user._id);
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
      return res.status(403).json({ message: 'Access denied' });
    }

    const filename = encodeURIComponent(attachment.originalName || attachment.filename);

    res.set({
      'Content-Type': attachment.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': attachment.size,
      'Cache-Control': 'private, max-age=3600'
    });

    res.send(attachment.data);
  } catch (error) {
    console.error('Download notification attachment error:', error);
    res.status(500).json({ message: 'Failed to download attachment', error: error.message });
  }
};
