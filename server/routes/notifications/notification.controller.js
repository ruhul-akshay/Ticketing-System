import Notification from '../../models/Notification.js';
import User from '../../models/User.js';

export const createNotification = async (req, res) => {
  try {
    const { title, message, targetType, targetId } = req.body;
    
    let targetModel = null;
    if (targetType === 'department') targetModel = 'Department';
    if (targetType === 'company') targetModel = 'Company';

    const notification = await Notification.create({
      title,
      message,
      targetType,
      targetId: targetId || null,
      targetModel,
      createdBy: req.user._id
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create notification', error: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Build the query
    const conditions = [{ targetType: 'all' }];
    
    if (user.department) {
      conditions.push({ targetType: 'department', targetId: user.department });
    }
    
    if (user.company) {
      conditions.push({ targetType: 'company', targetId: user.company });
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
    
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { readNotifications: id }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as read', error: error.message });
  }
};
