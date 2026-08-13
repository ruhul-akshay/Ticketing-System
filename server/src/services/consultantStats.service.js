import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import ClientUser from '../models/ClientUser.js';
import ConsultantProfile from '../models/ConsultantProfile.js';

export const buildConsultantStats = async (consultantUser, filters = {}) => {
  const consultantId = consultantUser._id;
  const { startDate, endDate } = filters;

  const dateQuery = {};
  if (startDate && endDate) {
    dateQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const workLogDateQuery = {};
  if (startDate && endDate) {
    workLogDateQuery['workLogs.date'] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const solvedDateQuery = {};
  if (startDate && endDate) {
    solvedDateQuery.solvedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // ---- Ticket counts ----
  const [totalTickets, openTickets, resolvedTickets] = await Promise.all([
    Ticket.countDocuments({ assignedTo: consultantId, ...dateQuery }),
    Ticket.countDocuments({ assignedTo: consultantId, status: { $in: ['pending', 'assigned', 'hold', 'on hold'] }, ...dateQuery }),
    Ticket.countDocuments({ assignedTo: consultantId, status: { $in: ['resolved', 'closed'] }, ...dateQuery }),
  ]);

  // ---- Work hours logged ----
  const workHoursMatch = { 'workLogs.addedBy': new mongoose.Types.ObjectId(consultantId) };
  if (startDate && endDate) {
    workHoursMatch['workLogs.date'] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const workHoursAgg = await Ticket.aggregate([
    { $unwind: { path: '$workLogs', preserveNullAndEmptyArrays: false } },
    { $match: workHoursMatch },
    {
      $group: {
        _id: null,
        totalHours: { $sum: '$workLogs.hours' },
      },
    },
  ]);

  const totalWorkHours = workHoursAgg[0]?.totalHours || 0;

  // ---- Work log by date ----
  const workLogByDateMatch = {
    'workLogs.addedBy': new mongoose.Types.ObjectId(consultantId)
  };
  
  if (startDate && endDate) {
    workLogByDateMatch['workLogs.date'] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    workLogByDateMatch['workLogs.date'] = { $gte: thirtyDaysAgo };
  }

  const workLogByDate = await Ticket.aggregate([
    { $unwind: { path: '$workLogs', preserveNullAndEmptyArrays: false } },
    { $match: workLogByDateMatch },
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

  // ---- Client-wise ticket breakdown ----
  const clientBreakdownMatch = { assignedTo: consultantId };
  if (startDate && endDate) {
    clientBreakdownMatch.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const clientBreakdown = await Ticket.aggregate([
    { $match: clientBreakdownMatch },
    {
      $lookup: {
        from: 'clientusers',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'creator',
      },
    },
    { $unwind: { path: '$creator', preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: { $ifNull: ['$creator.clientName', 'Unknown'] },
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] } },
        open: { $sum: { $cond: [{ $in: ['$status', ['pending', 'assigned', 'hold', 'on hold']] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        client: '$_id',
        total: 1,
        resolved: 1,
        open: 1,
      },
    },
    { $sort: { total: -1 } },
    { $limit: 10 },
  ]);

  // ---- Client-wise work hours ----
  const clientWorkHoursMatch = { 'workLogs.addedBy': new mongoose.Types.ObjectId(consultantId) };
  if (startDate && endDate) {
    clientWorkHoursMatch['workLogs.date'] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const clientWorkHours = await Ticket.aggregate([
    { $unwind: { path: '$workLogs', preserveNullAndEmptyArrays: false } },
    { $match: clientWorkHoursMatch },
    {
      $lookup: {
        from: 'clientusers',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'creator',
      },
    },
    { $unwind: { path: '$creator', preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: { $ifNull: ['$creator.clientName', 'Unknown'] },
        hours: { $sum: '$workLogs.hours' },
        tickets: { $addToSet: '$_id' },
      },
    },
    {
      $project: {
        _id: 0,
        client: '$_id',
        hours: 1,
        ticketCount: { $size: '$tickets' },
      },
    },
    { $sort: { hours: -1 } },
    { $limit: 10 },
  ]);

  // ---- Avg resolution time ----
  const avgResolutionMatch = {
    solvedBy: new mongoose.Types.ObjectId(consultantId),
    timeToSolve: { $exists: true, $gt: 0 }
  };
  if (startDate && endDate) {
    avgResolutionMatch.solvedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const avgResolutionAgg = await Ticket.aggregate([
    { $match: avgResolutionMatch },
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
  const ticketsSolvedByConsultant = avgResolutionAgg[0]?.ticketsSolved || 0;

  // ---- Consultant profile ----
  const consultantProfile = await ConsultantProfile.findOne({ user: consultantId })
    .populate('department', 'name description categories')
    .lean();

  const department = consultantUser.department && typeof consultantUser.department === 'object'
    ? consultantUser.department
    : consultantProfile?.department || null;

  // ---- Reviews/Feedback ----
  const reviewsMatch = {
    assignedTo: consultantId,
    'feedback.rating': { $exists: true }
  };
  if (startDate && endDate) {
    reviewsMatch['feedback.submittedAt'] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const reviews = await Ticket.find(reviewsMatch)
  .select('ticketNumber title feedback createdBy')
  .populate('createdBy', 'name email clientName')
  .sort({ 'feedback.submittedAt': -1 })
  .lean();

  const formattedReviews = reviews.map(r => ({
    ticketNumber: r.ticketNumber,
    title: r.title,
    rating: r.feedback?.rating,
    comment: r.feedback?.comment || '',
    submittedAt: r.feedback?.submittedAt || null,
    userName: r.createdBy?.name || 'Client',
    clientName: r.createdBy?.clientName || 'Unknown'
  }));

  return {
    consultant: {
      _id: consultantUser._id,
      name: consultantUser.name,
      email: consultantUser.email,
      role: consultantUser.role,
      employeeCode: consultantUser.employeeCode,
      joinedAt: consultantUser.createdAt,
      expertise: consultantProfile?.expertise || [],
      phone: consultantProfile?.phone || '',
      employeeId: consultantProfile?.employeeId || '',
      hourlyCost: consultantUser.hourlyCost || 0
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
      solvedByConsultant: ticketsSolvedByConsultant,
    },
    workHours: {
      total: +totalWorkHours.toFixed(1),
      avgResolutionHours,
      byDate: workLogByDate,
      hourlyCost: consultantUser.hourlyCost || 0,
      totalCost: +(totalWorkHours * (consultantUser.hourlyCost || 0)).toFixed(2)
    },
    clientBreakdown,
    clientWorkHours,
    reviews: formattedReviews
  };
};

export const getMyConsultantStats = async (currentUser, filters = {}) => {
  const consultantUser = await ClientUser.findById(currentUser._id)
    .populate('department', 'name description categories');
  if (!consultantUser) {
    throw new Error('ClientUser not found');
  }

  return await buildConsultantStats(consultantUser, filters);
};

export const getAllConsultantsStatsSummary = async (filters = {}) => {
  const { startDate, endDate } = filters;
  const consultants = await ClientUser.find({ role: 'consultant' })
    .populate('department', 'name')
    .select('name email employeeCode department createdAt hourlyCost')
    .lean();

  const dateQuery = {};
  if (startDate && endDate) {
    dateQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  return await Promise.all(
    consultants.map(async (consultant) => {
      const [total, resolved, open] = await Promise.all([
        Ticket.countDocuments({ assignedTo: consultant._id, ...dateQuery }),
        Ticket.countDocuments({ assignedTo: consultant._id, status: { $in: ['resolved', 'closed'] }, ...dateQuery }),
        Ticket.countDocuments({ assignedTo: consultant._id, status: { $in: ['pending', 'assigned', 'hold', 'on hold'] }, ...dateQuery }),
      ]);

      const workHoursMatch = { 'workLogs.addedBy': new mongoose.Types.ObjectId(consultant._id) };
      if (startDate && endDate) {
        workHoursMatch['workLogs.date'] = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const workHoursAgg = await Ticket.aggregate([
        { $unwind: { path: '$workLogs', preserveNullAndEmptyArrays: false } },
        { $match: workHoursMatch },
        { $group: { _id: null, totalHours: { $sum: '$workLogs.hours' } } },
      ]);

      const totalWorkHours = +(workHoursAgg[0]?.totalHours || 0).toFixed(1);
      const hourlyCost = consultant.hourlyCost || 0;
      const totalCost = +(totalWorkHours * hourlyCost).toFixed(2);

      return {
        _id: consultant._id,
        name: consultant.name,
        email: consultant.email,
        employeeCode: consultant.employeeCode,
        department: consultant.department?.name || 'Unassigned',
        joinedAt: consultant.createdAt,
        tickets: { total, resolved, open },
        totalWorkHours,
        hourlyCost,
        totalCost
      };
    })
  );
};

export const getSpecificConsultantStats = async (consultantId, filters = {}) => {
  if (!mongoose.Types.ObjectId.isValid(consultantId)) {
    throw new Error('Invalid consultant ID format');
  }

  const consultantUser = await ClientUser.findById(consultantId)
    .populate('department', 'name description categories');

  if (!consultantUser || consultantUser.role !== 'consultant') {
    throw new Error('Consultant user not found');
  }

  return await buildConsultantStats(consultantUser, filters);
};
