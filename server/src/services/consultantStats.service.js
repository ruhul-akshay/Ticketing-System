import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import ClientUser from '../models/ClientUser.js';
import ConsultantProfile from '../models/ConsultantProfile.js';
import Client from '../models/Client.js';
import Department from '../models/Department.js';

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

export const getConsultantReportsData = async (currentUser, filters = {}) => {
  const { startDate, endDate, clientId, departmentId, status, consultantId } = filters;

  let targetConsultantId = null;
  if (currentUser.role === 'consultant') {
    targetConsultantId = new mongoose.Types.ObjectId(currentUser._id);
  } else if (currentUser.role === 'superadmin') {
    if (consultantId && consultantId !== 'all') {
      targetConsultantId = new mongoose.Types.ObjectId(consultantId);
    }
  } else {
    targetConsultantId = new mongoose.Types.ObjectId(currentUser._id);
  }

  // Build match query for tickets
  const ticketQuery = {};

  if (targetConsultantId) {
    ticketQuery.$or = [
      { assignedTo: targetConsultantId },
      { assignedConsultants: targetConsultantId },
      { solvedBy: targetConsultantId },
      { 'workLogs.addedBy': targetConsultantId }
    ];
  }

  if (startDate && endDate) {
    ticketQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (clientId && clientId !== 'all') {
    ticketQuery.$and = [
      ...(ticketQuery.$and || []),
      {
        $or: [
          { client: new mongoose.Types.ObjectId(clientId) }
        ]
      }
    ];
  }

  if (departmentId && departmentId !== 'all') {
    ticketQuery.department = new mongoose.Types.ObjectId(departmentId);
  }

  if (status && status !== 'all') {
    const s = status.toLowerCase();
    if (s === 'open') {
      ticketQuery.status = { $in: ['open', 'pending', 'assigned', 'open protocol'] };
    } else if (s === 'on hold' || s === 'hold') {
      ticketQuery.status = { $in: ['hold', 'on hold'] };
    } else if (s === 'resolved') {
      ticketQuery.status = { $in: ['resolved', 'closed', 'resolution complete'] };
    } else {
      ticketQuery.status = s;
    }
  }

  const [tickets, allClients, allDepartments, consultantsList] = await Promise.all([
    Ticket.find(ticketQuery)
      .populate('createdBy', 'name email client clientName')
      .populate('client', 'name domain contactEmail contactPerson')
      .populate('department', 'name categories')
      .populate('assignedTo', 'name email employeeCode hourlyCost')
      .populate('assignedConsultants', 'name email employeeCode hourlyCost')
      .populate('solvedBy', 'name email')
      .populate('workLogs.addedBy', 'name email hourlyCost')
      .sort({ createdAt: -1 })
      .lean(),
    Client.find().select('name domain').sort({ name: 1 }).lean(),
    Department.find().select('name categories').sort({ name: 1 }).lean(),
    currentUser.role === 'superadmin' 
      ? ClientUser.find({ role: 'consultant' }).select('name email employeeCode').sort({ name: 1 }).lean()
      : []
  ]);

  const getClientInfo = (t) => {
    if (t.client && t.client.name) {
      return { id: t.client._id?.toString(), name: t.client.name, domain: t.client.domain || '' };
    }
    if (t.createdBy?.clientName) {
      return { id: t.createdBy?.client?.toString() || 'custom', name: t.createdBy.clientName, domain: '' };
    }
    return { id: 'unassigned', name: 'Internal / Unassigned', domain: '' };
  };

  // 1. Process Itemized Work Logs
  const allWorkLogs = [];
  tickets.forEach(ticket => {
    const clientInfo = getClientInfo(ticket);
    const logs = ticket.workLogs || [];
    logs.forEach((log, idx) => {
      const logAddedById = log.addedBy?._id?.toString() || log.addedBy?.toString();
      if (targetConsultantId && String(logAddedById) !== String(targetConsultantId)) {
        return;
      }

      const logDate = log.date ? new Date(log.date) : new Date(ticket.createdAt);
      if (startDate && endDate) {
        const s = new Date(startDate);
        const e = new Date(endDate);
        if (logDate < s || logDate > e) {
          return;
        }
      }

      const hours = Number(log.hours || 0);
      const consultantName = log.addedBy?.name || ticket.assignedTo?.name || 'Consultant';
      const hourlyCost = Number(log.addedBy?.hourlyCost || ticket.assignedTo?.hourlyCost || 0);

      allWorkLogs.push({
        id: `${ticket._id}_${idx}`,
        logIndex: idx,
        date: logDate.toISOString().split('T')[0],
        rawDate: logDate,
        hours,
        ticketId: ticket._id.toString(),
        customId: ticket.customId || ticket.ticketNumber || ticket._id.toString().slice(-6).toUpperCase(),
        ticketTitle: ticket.title,
        clientName: clientInfo.name,
        clientId: clientInfo.id,
        departmentName: ticket.department?.name || 'General',
        category: ticket.category || 'General',
        status: ticket.status,
        priority: ticket.priority,
        consultantId: logAddedById,
        consultantName,
        hourlyCost,
        totalCost: +(hours * hourlyCost).toFixed(2),
      });
    });
  });

  // Sort work logs by date descending
  allWorkLogs.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

  // 2. Ticket Summary Report Data
  let openCount = 0;
  let holdCount = 0;
  let resolvedCount = 0;
  let cancelledCount = 0;
  const priorityDist = { critical: 0, high: 0, medium: 0, low: 0 };
  const deptCountMap = {};
  const timelineMap = {};
  let totalResolutionMinutes = 0;
  let resolvedWithTimeCount = 0;

  const ticketList = tickets.map(t => {
    const clientInfo = getClientInfo(t);
    const s = (t.status || 'open').toLowerCase();
    
    if (['open', 'pending', 'assigned', 'open protocol'].includes(s)) openCount++;
    else if (['hold', 'on hold'].includes(s)) holdCount++;
    else if (['resolved', 'closed', 'resolution complete'].includes(s)) resolvedCount++;
    else if (s === 'cancelled') cancelledCount++;
    else openCount++;

    const p = (t.priority || 'medium').toLowerCase();
    if (priorityDist[p] !== undefined) priorityDist[p]++;

    const deptName = t.department?.name || 'General';
    deptCountMap[deptName] = (deptCountMap[deptName] || 0) + 1;

    const dateKey = t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '';
    if (dateKey) {
      if (!timelineMap[dateKey]) timelineMap[dateKey] = { date: dateKey, created: 0, resolved: 0 };
      timelineMap[dateKey].created++;
    }

    if (t.solvedAt) {
      const solveDateKey = new Date(t.solvedAt).toISOString().split('T')[0];
      if (!timelineMap[solveDateKey]) timelineMap[solveDateKey] = { date: solveDateKey, created: 0, resolved: 0 };
      timelineMap[solveDateKey].resolved++;

      if (t.timeToSolve && t.timeToSolve > 0) {
        totalResolutionMinutes += t.timeToSolve * 60;
        resolvedWithTimeCount++;
      } else {
        const diffMins = Math.max(0, Math.round((new Date(t.solvedAt) - new Date(t.createdAt)) / 60000));
        totalResolutionMinutes += diffMins;
        resolvedWithTimeCount++;
      }
    }

    const ticketHours = (t.workLogs || []).reduce((sum, l) => {
      if (targetConsultantId) {
        const lAddedBy = l.addedBy?._id?.toString() || l.addedBy?.toString();
        if (String(lAddedBy) === String(targetConsultantId)) {
          return sum + Number(l.hours || 0);
        }
        return sum;
      }
      return sum + Number(l.hours || 0);
    }, 0);

    return {
      _id: t._id,
      customId: t.customId || t.ticketNumber || t._id.toString().slice(-6).toUpperCase(),
      title: t.title,
      clientName: clientInfo.name,
      clientId: clientInfo.id,
      departmentName: deptName,
      category: t.category || 'General',
      priority: t.priority,
      status: t.status,
      assignedToName: t.assignedTo?.name || 'Unassigned',
      createdAt: t.createdAt,
      solvedAt: t.solvedAt,
      timeToSolve: t.timeToSolve || 0,
      workHours: +ticketHours.toFixed(1)
    };
  });

  const avgResolutionMinutes = resolvedWithTimeCount > 0 ? Math.round(totalResolutionMinutes / resolvedWithTimeCount) : 0;
  const totalTickets = tickets.length;
  const resolutionRate = totalTickets > 0 ? +((resolvedCount / totalTickets) * 100).toFixed(1) : 0;

  const departmentBreakdown = Object.entries(deptCountMap).map(([name, count]) => ({ name, count }));
  departmentBreakdown.sort((a, b) => b.count - a.count);

  const timelineTrend = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

  const totalLoggedHours = allWorkLogs.reduce((sum, l) => sum + (l.hours || 0), 0);

  const ticketSummary = {
    totalTickets,
    openTickets: openCount,
    onHoldTickets: holdCount,
    resolvedTickets: resolvedCount,
    cancelledTickets: cancelledCount,
    resolutionRate,
    avgResolutionMinutes,
    totalWorkHours: +totalLoggedHours.toFixed(1),
    priorityBreakdown: priorityDist,
    departmentBreakdown,
    timelineTrend,
    tickets: ticketList
  };

  // 3. Customer Wise Ticket Report Data
  const clientGroups = {};
  tickets.forEach(t => {
    const info = getClientInfo(t);
    const key = info.id || info.name;
    if (!clientGroups[key]) {
      clientGroups[key] = {
        clientId: info.id,
        clientName: info.name,
        domain: info.domain,
        totalTickets: 0,
        openTickets: 0,
        onHoldTickets: 0,
        resolvedTickets: 0,
        cancelledTickets: 0,
        totalWorkHours: 0,
        resolutionMinutesSum: 0,
        resolvedWithTimeCount: 0,
        tickets: []
      };
    }
    const g = clientGroups[key];
    g.totalTickets++;
    const s = (t.status || 'open').toLowerCase();
    if (['open', 'pending', 'assigned', 'open protocol'].includes(s)) g.openTickets++;
    else if (['hold', 'on hold'].includes(s)) g.onHoldTickets++;
    else if (['resolved', 'closed', 'resolution complete'].includes(s)) g.resolvedTickets++;
    else if (s === 'cancelled') g.cancelledTickets++;
    else g.openTickets++;

    if (t.solvedAt) {
      const diffMins = Math.max(0, Math.round((new Date(t.solvedAt) - new Date(t.createdAt)) / 60000));
      g.resolutionMinutesSum += diffMins;
      g.resolvedWithTimeCount++;
    }

    const ticketHours = (t.workLogs || []).reduce((sum, l) => {
      if (targetConsultantId) {
        const lAddedBy = l.addedBy?._id?.toString() || l.addedBy?.toString();
        if (String(lAddedBy) === String(targetConsultantId)) {
          return sum + Number(l.hours || 0);
        }
        return sum;
      }
      return sum + Number(l.hours || 0);
    }, 0);
    g.totalWorkHours += ticketHours;

    g.tickets.push({
      _id: t._id,
      customId: t.customId || t.ticketNumber || t._id.toString().slice(-6).toUpperCase(),
      title: t.title,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt,
      solvedAt: t.solvedAt,
      workHours: +ticketHours.toFixed(1)
    });
  });

  const customerWiseReport = Object.values(clientGroups).map(g => {
    const rate = g.totalTickets > 0 ? +((g.resolvedTickets / g.totalTickets) * 100).toFixed(1) : 0;
    const avgMins = g.resolvedWithTimeCount > 0 ? Math.round(g.resolutionMinutesSum / g.resolvedWithTimeCount) : 0;
    return {
      clientId: g.clientId,
      clientName: g.clientName,
      domain: g.domain,
      totalTickets: g.totalTickets,
      openTickets: g.openTickets,
      onHoldTickets: g.onHoldTickets,
      resolvedTickets: g.resolvedTickets,
      cancelledTickets: g.cancelledTickets,
      resolutionRate: rate,
      totalWorkHours: +g.totalWorkHours.toFixed(1),
      avgResolutionMinutes: avgMins,
      tickets: g.tickets
    };
  });
  customerWiseReport.sort((a, b) => b.totalTickets - a.totalTickets);

  // 4. Timesheet Report Details Data
  const uniqueTicketsSet = new Set(allWorkLogs.map(l => l.ticketId));
  const uniqueClientsSet = new Set(allWorkLogs.map(l => l.clientName));
  const totalCostSum = allWorkLogs.reduce((sum, l) => sum + (l.totalCost || 0), 0);

  const timesheetDetails = {
    summary: {
      totalHours: +totalLoggedHours.toFixed(1),
      totalEntries: allWorkLogs.length,
      uniqueTicketsCount: uniqueTicketsSet.size,
      uniqueClientsCount: uniqueClientsSet.size,
      totalCost: +totalCostSum.toFixed(2)
    },
    entries: allWorkLogs
  };

  // 5. Timesheet Report Summary Data
  // Group by Date
  const dateMap = {};
  allWorkLogs.forEach(l => {
    if (!dateMap[l.date]) {
      const d = new Date(l.date);
      dateMap[l.date] = {
        date: l.date,
        dayOfWeek: isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        totalHours: 0,
        ticketsSet: new Set(),
        clientsSet: new Set(),
        entriesCount: 0
      };
    }
    dateMap[l.date].totalHours += l.hours;
    dateMap[l.date].ticketsSet.add(l.ticketId);
    dateMap[l.date].clientsSet.add(l.clientName);
    dateMap[l.date].entriesCount++;
  });

  const byDate = Object.values(dateMap).map(d => ({
    date: d.date,
    dayOfWeek: d.dayOfWeek,
    totalHours: +d.totalHours.toFixed(1),
    ticketsCount: d.ticketsSet.size,
    clientsCount: d.clientsSet.size,
    entriesCount: d.entriesCount
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Group by Customer / Client
  const clientHoursMap = {};
  allWorkLogs.forEach(l => {
    if (!clientHoursMap[l.clientName]) {
      clientHoursMap[l.clientName] = {
        clientId: l.clientId,
        clientName: l.clientName,
        totalHours: 0,
        ticketsSet: new Set(),
        entriesCount: 0
      };
    }
    clientHoursMap[l.clientName].totalHours += l.hours;
    clientHoursMap[l.clientName].ticketsSet.add(l.ticketId);
    clientHoursMap[l.clientName].entriesCount++;
  });

  const byClient = Object.values(clientHoursMap).map(c => ({
    clientId: c.clientId,
    clientName: c.clientName,
    totalHours: +c.totalHours.toFixed(1),
    percentage: totalLoggedHours > 0 ? +((c.totalHours / totalLoggedHours) * 100).toFixed(1) : 0,
    ticketsCount: c.ticketsSet.size,
    entriesCount: c.entriesCount
  })).sort((a, b) => b.totalHours - a.totalHours);

  // Group by Ticket
  const ticketHoursMap = {};
  allWorkLogs.forEach(l => {
    if (!ticketHoursMap[l.ticketId]) {
      ticketHoursMap[l.ticketId] = {
        ticketId: l.ticketId,
        customId: l.customId,
        title: l.ticketTitle,
        clientName: l.clientName,
        status: l.status,
        priority: l.priority,
        totalHours: 0,
        lastLoggedDate: l.date,
        entriesCount: 0
      };
    }
    ticketHoursMap[l.ticketId].totalHours += l.hours;
    ticketHoursMap[l.ticketId].entriesCount++;
    if (l.date > ticketHoursMap[l.ticketId].lastLoggedDate) {
      ticketHoursMap[l.ticketId].lastLoggedDate = l.date;
    }
  });

  const byTicket = Object.values(ticketHoursMap).map(t => ({
    ticketId: t.ticketId,
    customId: t.customId,
    title: t.title,
    clientName: t.clientName,
    status: t.status,
    priority: t.priority,
    totalHours: +t.totalHours.toFixed(1),
    lastLoggedDate: t.lastLoggedDate,
    entriesCount: t.entriesCount
  })).sort((a, b) => b.totalHours - a.totalHours);

  const activeDaysCount = byDate.length;
  const dailyAverage = activeDaysCount > 0 ? +(totalLoggedHours / activeDaysCount).toFixed(1) : 0;
  const topCustomer = byClient.length > 0 ? byClient[0].clientName : 'None';
  const mostProductiveDay = byDate.length > 0 
    ? [...byDate].sort((a, b) => b.totalHours - a.totalHours)[0]?.date 
    : 'None';

  const timesheetSummary = {
    kpi: {
      totalHours: +totalLoggedHours.toFixed(1),
      dailyAverage,
      activeDaysCount,
      topCustomer,
      mostProductiveDay
    },
    byDate,
    byClient,
    byTicket
  };

  return {
    ticketSummary,
    customerWiseReport,
    timesheetDetails,
    timesheetSummary,
    clients: allClients.map(c => ({ _id: c._id, name: c.name })),
    departments: allDepartments.map(d => ({ _id: d._id, name: d.name })),
    consultants: consultantsList.map(c => ({ _id: c._id, name: c.name, employeeCode: c.employeeCode }))
  };
};
