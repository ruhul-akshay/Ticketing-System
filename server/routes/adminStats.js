import express from 'express';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import AdminProfile from '../models/AdminProfile.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/* ====================================================
   Helper: build stats for a given admin user object
==================================================== */
async function buildAdminStats(adminUser) {
  const adminId = adminUser._id;

  // Department filter – tickets in this admin's department
  const deptFilter = adminUser.department
    ? { department: adminUser.department._id || adminUser.department }
    : {};

  // ---- Ticket counts ----
  const [totalTickets, openTickets, resolvedTickets] = await Promise.all([
    Ticket.countDocuments(deptFilter),
    Ticket.countDocuments({ ...deptFilter, status: 'pending' }),
    Ticket.countDocuments({ ...deptFilter, status: 'resolved' }),
  ]);

  // ---- Work hours from workLogs logged by this admin ----
  const workHoursAgg = await Ticket.aggregate([
    { $match: Object.keys(deptFilter).length ? deptFilter : {} },
    { $unwind: { path: '$workLogs', preserveNullAndEmptyArrays: false } },
    { $match: { 'workLogs.addedBy': new mongoose.Types.ObjectId(adminId) } },
    {
      $group: {
        _id: null,
        totalHours: { $sum: '$workLogs.hours' },
      },
    },
  ]);

  const totalWorkHours = workHoursAgg[0]?.totalHours || 0;

  // ---- Work log by date (last 30 days) ----
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const workLogByDate = await Ticket.aggregate([
    { $unwind: { path: '$workLogs', preserveNullAndEmptyArrays: false } },
    {
      $match: {
        'workLogs.addedBy': new mongoose.Types.ObjectId(adminId),
        'workLogs.date': { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: { $toDate: '$workLogs.date' } },
        },
        hours: { $sum: '$workLogs.hours' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', hours: 1 } },
  ]);

  // ---- Company-wise ticket breakdown ----
  const companyBreakdown = await Ticket.aggregate([
    { $match: Object.keys(deptFilter).length ? deptFilter : {} },
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'creator',
      },
    },
    { $unwind: { path: '$creator', preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: { $ifNull: ['$creator.companyName', 'Unknown'] },
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        open: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        company: '$_id',
        total: 1,
        resolved: 1,
        open: 1,
      },
    },
    { $sort: { total: -1 } },
    { $limit: 10 },
  ]);

  // ---- Company-wise work hours ----
  const companyWorkHours = await Ticket.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'creator',
      },
    },
    { $unwind: { path: '$creator', preserveNullAndEmptyArrays: false } },
    { $unwind: { path: '$workLogs', preserveNullAndEmptyArrays: false } },
    { $match: { 'workLogs.addedBy': new mongoose.Types.ObjectId(adminId) } },
    {
      $group: {
        _id: { $ifNull: ['$creator.companyName', 'Unknown'] },
        hours: { $sum: '$workLogs.hours' },
        tickets: { $addToSet: '$_id' },
      },
    },
    {
      $project: {
        _id: 0,
        company: '$_id',
        hours: 1,
        ticketCount: { $size: '$tickets' },
      },
    },
    { $sort: { hours: -1 } },
    { $limit: 10 },
  ]);

  // ---- Avg resolution time for tickets personally solved ----
  const avgResolutionAgg = await Ticket.aggregate([
    {
      $match: {
        solvedBy: new mongoose.Types.ObjectId(adminId),
        timeToSolve: { $exists: true, $gt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        avgMs: { $avg: '$timeToSolve' },
        ticketsSolved: { $sum: 1 },
      },
    },
  ]);

  const avgResolutionHours = avgResolutionAgg[0]
    ? +(avgResolutionAgg[0].avgMs / (1000 * 60 * 60)).toFixed(1)
    : 0;
  const ticketsSolvedByAdmin = avgResolutionAgg[0]?.ticketsSolved || 0;

  // ---- Admin profile & department info ----
  const adminProfile = await AdminProfile.findOne({ user: adminId })
    .populate('department', 'name description categories')
    .lean();

  // Prefer the populated department from User, fall back to AdminProfile's department
  const department = adminUser.department && typeof adminUser.department === 'object'
    ? adminUser.department
    : adminProfile?.department || null;

  return {
    admin: {
      _id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      employeeCode: adminUser.employeeCode,
      joinedAt: adminUser.createdAt,
      expertise: adminProfile?.expertise || [],
      phone: adminProfile?.phone || '',
      employeeId: adminProfile?.employeeId || '',
    },
    department: department
      ? {
          name: department.name,
          description: department.description || '',
          categories: department.categories || [],
        }
      : null,
    tickets: {
      total: totalTickets,
      open: openTickets,
      resolved: resolvedTickets,
      solvedByAdmin: ticketsSolvedByAdmin,
    },
    workHours: {
      total: +totalWorkHours.toFixed(1),
      avgResolutionHours,
      byDate: workLogByDate,
    },
    companyBreakdown,
    companyWorkHours,
  };
}

/* ====================================================
   GET /api/admin-stats/me
   Admin (or superadmin) views own stats
==================================================== */
router.get('/me', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const adminUser = await User.findById(req.user._id)
      .populate('department', 'name description categories');
    if (!adminUser) return res.status(404).json({ success: false, message: 'User not found' });

    const stats = await buildAdminStats(adminUser);
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Admin stats /me error:', err);
    res.status(500).json({ success: false, message: 'Failed to load admin stats', error: err.message });
  }
});

/* ====================================================
   GET /api/admin-stats
   Superadmin views summary list of all admins
   MUST be defined BEFORE /:adminId to avoid conflict
==================================================== */
router.get('/', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .populate('department', 'name')
      .select('name email employeeCode department createdAt')
      .lean();

    const summaries = await Promise.all(
      admins.map(async (admin) => {
        const deptId = admin.department?._id || admin.department;
        const deptFilter = deptId ? { department: deptId } : {};

        const [total, resolved, open] = await Promise.all([
          Ticket.countDocuments(deptFilter),
          Ticket.countDocuments({ ...deptFilter, status: 'resolved' }),
          Ticket.countDocuments({ ...deptFilter, status: 'pending' }),
        ]);

        const workHoursAgg = await Ticket.aggregate([
          ...(Object.keys(deptFilter).length ? [{ $match: deptFilter }] : []),
          { $unwind: { path: '$workLogs', preserveNullAndEmptyArrays: false } },
          { $match: { 'workLogs.addedBy': new mongoose.Types.ObjectId(admin._id) } },
          { $group: { _id: null, totalHours: { $sum: '$workLogs.hours' } } },
        ]);

        return {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          employeeCode: admin.employeeCode,
          department: admin.department?.name || 'Unassigned',
          joinedAt: admin.createdAt,
          tickets: { total, resolved, open },
          totalWorkHours: +(workHoursAgg[0]?.totalHours || 0).toFixed(1),
        };
      })
    );

    res.json({ success: true, data: summaries });
  } catch (err) {
    console.error('Admin stats list error:', err);
    res.status(500).json({ success: false, message: 'Failed to load admin stats', error: err.message });
  }
});

/* ====================================================
   GET /api/admin-stats/:adminId
   Superadmin views a specific admin's full stats
==================================================== */
router.get('/:adminId', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ success: false, message: 'Invalid admin ID format' });
    }

    const adminUser = await User.findById(adminId)
      .populate('department', 'name description categories');

    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    const stats = await buildAdminStats(adminUser);
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Admin stats /:adminId error:', err);
    res.status(500).json({ success: false, message: 'Failed to load admin stats', error: err.message });
  }
});

export default router;
