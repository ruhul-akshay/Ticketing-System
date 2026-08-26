import Ticket from '../models/Ticket.js';
import ClientUser from '../models/ClientUser.js';
import ConsultantProfile from '../models/ConsultantProfile.js';
import Client from '../models/Client.js';
import PreAssignmentRule from '../models/PreAssignmentRule.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { generateTicketNumber, isValidObjectId } from '../utils/ticket.helpers.js';
import Holiday from '../models/Holiday.js';
import Notification from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';
import { logger }   from '../utils/logger.js';

const checkConsultantOnLeave = async (consultantId) => {
  const today = new Date();
  const midnight = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));
  const consultant = await ClientUser.findOne({
    _id: consultantId,
    leaveFrom: { $lte: midnight },
    leaveTo: { $gte: midnight }
  });
  return !!consultant;
};

const checkClientUserAccess = async (currentUser, ticket) => {
  if (currentUser.role !== 'clientuser') return true;
  
  const creatorId = ticket.createdBy?._id || ticket.createdBy;
  if (!creatorId) return false;
  
  if (creatorId.toString() === currentUser._id.toString()) {
    return true;
  }
  
  if (currentUser.isPrimaryContact && currentUser.client) {
    let creator = ticket.createdBy;
    if (creator && creator.client) {
      return creator.client.toString() === currentUser.client.toString();
    }
    const userDoc = await ClientUser.findById(creatorId).select('client');
    if (userDoc && userDoc.client) {
      return userDoc.client.toString() === currentUser.client.toString();
    }
  }
  
  return false;
};

const getCleanIdString = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id.trim().toLowerCase();
  
  if (id.toHexString && typeof id.toHexString === 'function') {
    return id.toHexString().trim().toLowerCase();
  }
  
  const target = id._id || id.id || id;
  if (target && target.toHexString && typeof target.toHexString === 'function') {
    return target.toHexString().trim().toLowerCase();
  }
  if (target && typeof target === 'object') {
    const innerTarget = target._id || target.id || target;
    if (innerTarget && innerTarget.toHexString && typeof innerTarget.toHexString === 'function') {
      return innerTarget.toHexString().trim().toLowerCase();
    }
    return (innerTarget || '').toString().trim().toLowerCase();
  }
  
  return (target || '').toString().trim().toLowerCase();
};

const matchIds = (id1, id2) => {
  const str1 = getCleanIdString(id1);
  const str2 = getCleanIdString(id2);
  return str1 && str2 && str1 === str2;
};

const isAuthorizedConsultant = (currentUser, ticket) => {
  if (currentUser.role === 'superadmin') return true;
  if (currentUser.role !== 'consultant' && currentUser.role !== 'admin') return true;

  const assignedId = ticket.assignedTo?._id || ticket.assignedTo;
  const isAssigned = matchIds(assignedId, currentUser._id);

  const isAssociated = ticket.assignmentHistory?.some(h => 
    matchIds(h.assignedTo, currentUser._id) ||
    matchIds(h.assignedBy, currentUser._id) ||
    matchIds(h.forwardedBy, currentUser._id) ||
    matchIds(h.forwardedTo, currentUser._id)
  );

  const isRemarkSender = ticket.remarks?.some(r => 
    matchIds(r.addedBy, currentUser._id)
  );

  const isCreator = matchIds(ticket.createdBy?._id || ticket.createdBy, currentUser._id);

  const isCcEmail = ticket.ccEmails?.some(email => 
    email && currentUser.email && email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()
  );

  const result = !!(isAssigned || isAssociated || isRemarkSender || isCcEmail || isCreator);

  logger.debug('isAuthorizedConsultant evaluated', {
    ticketId:      ticket._id,
    currentUserId: currentUser._id,
    isAssigned,
    isAssociated,
    isRemarkSender,
    isCcEmail,
    isCreator,
    result,
  });

  return result;
};

import {
  sendTicketCreatedEmail,
  sendConsultantTicketAlertEmail,
  sendTicketResolvedEmail,
  sendTicketStatusUpdatedEmail,
  sendNewMessageNotificationEmail,
  sendTicketAssignedConsultantEmail,
  sendTicketForwardedUserEmail,
  sendTicketForwardedConsultantEmail
} from '../utils/email.js';

/* ── Module-level helpers ─────────────────────────────────────────────────── */

/**
 * Map a multer file array into the attachment sub-document shape.
 * Extracted here once so createTicket and updateTicket share the same logic.
 */
const processFiles = (fileArray) =>
  fileArray?.map((file) => ({
    filename:     `${Date.now()}-${file.originalname}`,
    originalName: file.originalname,
    mimeType:     file.mimetype,
    size:         file.size,
    data:         file.buffer,
    uploadedAt:   new Date(),
  })) ?? [];

/**
 * Build the MongoDB $or query that limits a consultant / admin to tickets they
 * are directly involved with (assigned, forwarded, cc'd, remarked, created).
 */
const buildConsultantTicketQuery = (currentUser) => {
  const orClauses = [
    { createdBy: currentUser._id },
    { assignedTo: currentUser._id },
    { 'assignmentHistory.assignedTo':  currentUser._id },
    { 'assignmentHistory.assignedBy':  currentUser._id },
    { 'assignmentHistory.forwardedBy': currentUser._id },
    { 'assignmentHistory.forwardedTo': currentUser._id },
    { 'remarks.addedBy': currentUser._id },
  ];
  if (currentUser.email) {
    orClauses.push({ ccEmails: currentUser.email });
  }
  return { $or: orClauses };
};

export const getTickets = async (currentUser) => {
  const query = {};

  if (currentUser.role === 'clientuser') {
    if (currentUser.isPrimaryContact && currentUser.client) {
      const teamUserIds = await ClientUser.find({ client: currentUser.client }).distinct('_id');
      query.$or = [
        { createdBy: { $in: teamUserIds } },
        { client: currentUser.client, isVisibleToClient: true }
      ];
    } else {
      query.$or = [
        { createdBy: currentUser._id },
        { clientUser: currentUser._id, isVisibleToClient: true }
      ];
    }
  }

  if (currentUser.role === 'consultant' || currentUser.role === 'admin') {
    query.$or = [
      { createdBy: currentUser._id },
      { assignedTo: currentUser._id },
      { 'assignmentHistory.assignedTo': currentUser._id },
      { 'assignmentHistory.assignedBy': currentUser._id },
      { 'assignmentHistory.forwardedBy': currentUser._id },
      { 'assignmentHistory.forwardedTo': currentUser._id },
      { 'remarks.addedBy': currentUser._id }
    ];
    if (currentUser.email) {
      query.$or.push({ ccEmails: currentUser.email });
    }
  }

  const tickets = await Ticket.find(query)
    .populate([
      { path: 'createdBy', select: 'name email clientName client', populate: { path: 'client', select: 'name' } },
      { path: 'assignedTo', select: 'name email role' },
      { path: 'solvedBy', select: 'name email' },
      { path: 'department', select: 'name description categories' },
      { path: 'remarks.addedBy', select: 'name email role' },
      { path: 'assignmentHistory.assignedBy', select: 'name email role' },
      { path: 'assignmentHistory.assignedTo', select: 'name email role' },
      { path: 'assignmentHistory.forwardedBy', select: 'name email role' },
      { path: 'assignmentHistory.forwardedTo', select: 'name email role' },
      { path: 'workLogs.addedBy', select: 'name email role' },
      { path: 'client', select: 'name' },
      { path: 'clientUser', select: 'name email' }
    ])
    .select('-attachments.data -adminAttachments.data -supportingDocuments.data')
    .sort({ updatedAt: -1, createdAt: -1 });

  return tickets.map(t => {
    const tObj = t.toObject();
    if (currentUser.role === 'clientuser' && tObj.remarks) {
      tObj.remarks = tObj.remarks.filter(r => !r.isInternal);
    }
    return {
      ...tObj,
      attachmentCount: t.attachments?.length || 0
    };
  });
};

export const exportTicketsCSV = async (currentUser) => {
  const query = {};

  if (currentUser.role === 'clientuser') {
    if (currentUser.isPrimaryContact && currentUser.client) {
      const teamUserIds = await ClientUser.find({ client: currentUser.client }).distinct('_id');
      query.createdBy = { $in: teamUserIds };
    } else {
      query.createdBy = currentUser._id;
    }
  }

  if (currentUser.role === 'consultant' || currentUser.role === 'admin') {
    query.$or = [
      { createdBy: currentUser._id },
      { assignedTo: currentUser._id },
      { 'assignmentHistory.assignedTo': currentUser._id },
      { 'assignmentHistory.assignedBy': currentUser._id },
      { 'assignmentHistory.forwardedBy': currentUser._id },
      { 'assignmentHistory.forwardedTo': currentUser._id },
      { 'remarks.addedBy': currentUser._id }
    ];
    if (currentUser.email) {
      query.$or.push({ ccEmails: currentUser.email });
    }
  }

  const tickets = await Ticket.find(query)
    .populate([
      { path: 'createdBy', select: 'name email clientName client', populate: { path: 'client', select: 'name' } },
      { path: 'assignedTo', select: 'name email role' },
      { path: 'solvedBy', select: 'name email' },
      { path: 'department', select: 'name description categories' }
    ])
    .sort({ createdAt: -1 });

  const headers = [
    'Ticket Number',
    'Title',
    'Description',
    'Category',
    'Reason',
    'Status',
    'Priority',
    'Created By Name',
    'Created By Email',
    'Created By Client',
    'Assigned To Name',
    'Assigned To Email',
    'Solved By Name',
    'Solved By Email',
    'Department Name',
    'Created At',
    'Solved At',
    'Expected Resolution Date',
    'Actual Resolution Date',
    'Time To Solve (Hours)',
    'Feedback Rating',
    'Feedback Comment',
    'Remarks Count',
    'Work Logs Hours'
  ];

  const rows = tickets.map(t => {
    const timeToSolveHours = t.timeToSolve ? (t.timeToSolve / (1000 * 60 * 60)).toFixed(2) : '';
    const totalWorkLogsHours = t.workLogs ? t.workLogs.reduce((sum, log) => sum + (log.hours || 0), 0) : 0;
    
    return [
      t.ticketNumber,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.reason || '').replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      `"${(t.createdBy?.name || '').replace(/"/g, '""')}"`,
      t.createdBy?.email || '',
      `"${(t.createdBy?.clientName || '').replace(/"/g, '""')}"`,
      `"${(t.assignedTo?.name || '').replace(/"/g, '""')}"`,
      t.assignedTo?.email || '',
      `"${(t.solvedBy?.name || '').replace(/"/g, '""')}"`,
      t.solvedBy?.email || '',
      `"${(t.department?.name || '').replace(/"/g, '""')}"`,
      t.createdAt ? t.createdAt.toISOString() : '',
      t.solvedAt ? t.solvedAt.toISOString() : '',
      t.expectedResolutionDate ? t.expectedResolutionDate.toISOString() : '',
      t.actualResolutionDate ? t.actualResolutionDate.toISOString() : '',
      timeToSolveHours,
      t.feedback?.rating || '',
      `"${(t.feedback?.comment || '').replace(/"/g, '""')}"`,
      t.remarks?.length || 0,
      totalWorkLogsHours
    ];
  });

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

export const getTicketById = async (currentUser, id) => {
  if (!isValidObjectId(id)) {
    throw new AppError('Invalid ticket ID', 400);
  }

  const ticket = await Ticket.findById(id)
    .populate([
      { path: 'createdBy', select: 'name email clientName client', populate: { path: 'client', select: 'name' } },
      { path: 'assignedTo', select: 'name email role' },
      { path: 'solvedBy', select: 'name email' },
      { path: 'department', select: 'name description categories' },
      { path: 'remarks.addedBy', select: 'name email role' },
      { path: 'adminAttachments.uploadedBy', select: 'name email' },
      { path: 'assignmentHistory.assignedBy', select: 'name email role' },
      { path: 'assignmentHistory.assignedTo', select: 'name email role' },
      { path: 'assignmentHistory.forwardedBy', select: 'name email role' },
      { path: 'assignmentHistory.forwardedTo', select: 'name email role' }
    ])
    .select('-attachments.data -adminAttachments.data -supportingDocuments.data');

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  const hasAccess = await checkClientUserAccess(currentUser, ticket);
  if (!hasAccess) {
    throw new AppError('Access denied', 403);
  }

  if (!isAuthorizedConsultant(currentUser, ticket)) {
    throw new AppError('Access denied: You are not assigned or associated with this ticket.', 403);
  }

  const ticketObj = ticket.toObject();
  if (currentUser.role === 'clientuser' && ticketObj.remarks) {
    ticketObj.remarks = ticketObj.remarks.filter(r => !r.isInternal);
  }

  return ticketObj;
};

export const createTicket = async (currentUser, data, files = {}) => {
  const { title, description, priority = 'medium', department, category, reason, ccEmails, erpIncidentType, isInternal, isVisibleToClient, client, clientUser } = data;

  if (!title?.trim())       throw new AppError('Title is required', 400);
  if (!description?.trim()) throw new AppError('Description is required', 400);
  if (!department)          throw new AppError('Department is required', 400);

  const departmentId = isValidObjectId(department) ? department : null;
  const creatorUserId = ['consultant', 'clientuser', 'superadmin'].includes(currentUser.role) && data.createdBy ? data.createdBy : currentUser._id;
  const creatorUser = await ClientUser.findById(creatorUserId).populate('client');

  const clientId = creatorUser?.client?._id || creatorUser?.client || null;
  const ticketNumber = await generateTicketNumber(departmentId, clientId, !!isInternal);

  const attachments         = processFiles(files.attachments);
  const supportingDocuments = processFiles(files.supportingDocuments);
  const adminAttachments    = processFiles(files.adminAttachments);

  const activeRules = await PreAssignmentRule.find({ isActive: true }).sort({ evaluationOrder: 1 });
  let matchedRule = null;
  if (creatorUser) {
    for (const rule of activeRules) {
      if (rule.conditionType === 'clientUser' && rule.clientUser && String(rule.clientUser) === String(creatorUser._id)) {
        matchedRule = rule;
        break;
      }
      if (rule.conditionType === 'client' && rule.client && creatorUser.client && String(rule.client) === String(creatorUser.client._id || creatorUser.client)) {
        matchedRule = rule;
        break;
      }
      if (rule.conditionType === 'department' && rule.department && departmentId && String(rule.department) === String(departmentId)) {
        if (rule.categories && rule.categories.length > 0) {
          if (category && rule.categories.includes(category)) {
            matchedRule = rule;
            break;
          }
        } else {
          matchedRule = rule;
          break;
        }
      }
      if (rule.conditionType === 'erpIncidentType' && Array.isArray(rule.erpIncidentType) && rule.erpIncidentType.length > 0 && erpIncidentType) {
        const isMatched = rule.erpIncidentType.some(type => String(type).toLowerCase() === String(erpIncidentType).toLowerCase());
        if (isMatched) {
          matchedRule = rule;
          break;
        }
      }
    }
  }

  const superAdmin = await ClientUser.findOne({ role: 'superadmin' });
  let assignedTo = superAdmin ? superAdmin._id : null;
  let status = 'pending';
  let initialRemarks = 'Initially assigned to Super Admin on creation.';

  if (isInternal) {
    if (data.assignedTo) {
      assignedTo = data.assignedTo;
      status = 'assigned';
      initialRemarks = 'Internal ticket assigned directly on creation.';
    } else {
      initialRemarks = 'Internal ticket created without direct assignment.';
    }
  } else if (matchedRule) {
    const isCcOnLeave = await checkConsultantOnLeave(matchedRule.assignedTo);
    if (!isCcOnLeave) {
      assignedTo = matchedRule.assignedTo;
      status = 'assigned';
      initialRemarks = `Pre-assigned automatically by rule: ${matchedRule.name}`;
    } else {
      const skippedCc = await ClientUser.findById(matchedRule.assignedTo, 'name');
      initialRemarks = `Pre-assignment rule '${matchedRule.name}' matched, but consultant ${skippedCc?.name || ''} is currently on approved leave. Re-routed to Super Admin.`;
    }
  }

  const assignmentHistory = assignedTo ? [{
    action: 'initial_assignment',
    assignedTo,
    remarks: initialRemarks,
    actionDate: new Date()
  }] : [];

  const ticket = await Ticket.create({
    ticketNumber,
    type: 'ticket',
    title: title.trim(),
    description: description.trim(),
    category: category || null,
    reason: reason || null,
    attachments,
    supportingDocuments,
    adminAttachments,
    priority,
    department: departmentId,
    createdBy: creatorUserId,
    status,
    assignedTo,
    assignmentHistory,
    ccEmails: Array.isArray(ccEmails) 
      ? ccEmails.map(e => e.split(',')).flat().map(e => e.trim()).filter(Boolean) 
      : (ccEmails ? ccEmails.split(',').map(e => e.trim()).filter(Boolean) : []),
    erpIncidentType: erpIncidentType || null,
    isInternal: !!isInternal,
    isVisibleToClient: !!isVisibleToClient,
    client: client || clientId || null,
    clientUser: clientUser || (creatorUser?.role === 'clientuser' ? creatorUserId : null)
  });

  await ticket.populate([
    { path: 'createdBy', populate: { path: 'client' } },
    { path: 'assignedTo' },
    { path: 'department' }
  ]);

  // Check if ticket is raised on a holiday or weekend
  let holidayReason = null;
  try {
    const checkDate = new Date(ticket.createdAt || new Date());
    const startOfDay = new Date(checkDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);

    const holidayRecord = await Holiday.findOne({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (holidayRecord) {
      holidayReason = holidayRecord.name;
    } else {
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek === 0) {
        holidayReason = 'Sunday Weekend';
      } else if (dayOfWeek === 6) {
        holidayReason = 'Saturday Weekend';
      }
    }
  } catch (err) {
    console.error('Error checking holiday/weekend status for ticket:', err);
  }

  const clientContactEmail = ticket.createdBy?.client?.contactEmail || null;
  // Build CC list: client contact email + any user-specified CC emails
  const ccList = [
    clientContactEmail,
    ...(ticket.ccEmails || [])
  ].filter(Boolean);
  sendTicketCreatedEmail(ticket.createdBy.email, ticket, ccList.length > 0 ? ccList : null, holidayReason)
      .catch(err => console.error('USER EMAIL ERROR:', err.message));

  if (matchedRule) {
    let ruleCCEmails = [];
    if (matchedRule.ccConsultants && matchedRule.ccConsultants.length > 0) {
      const ccUsers = await ClientUser.find({ _id: { $in: matchedRule.ccConsultants } }, 'email');
      ruleCCEmails = ccUsers.map(u => u.email).filter(Boolean);
    }
    const assignedConsultant = await ClientUser.findById(matchedRule.assignedTo);
    if (assignedConsultant && assignedConsultant.email) {
      sendTicketAssignedConsultantEmail(
        assignedConsultant.email,
        ticket,
        superAdmin || { name: 'System Rule Engine' },
        assignedConsultant,
        `Pre-assigned automatically by rule: ${matchedRule.name}`,
        ruleCCEmails.length > 0 ? ruleCCEmails : null
      ).catch(err => console.error('PRE-ASSIGN EMAIL ERROR:', err.message));
    }
  } else {
    sendConsultantTicketAlertEmail(ticket)
      .catch(err => console.error('CONSULTANT EMAIL ERROR:', err.message));
  }

  // Create in-app notification document so all users receive the new ticket notification in navbar bell
  try {
    const creatorName = creatorUser?.name || 'User';
    await Notification.create({
      title: `New Ticket Created: #${ticket.ticketNumber}`,
      message: `Ticket "${ticket.title}" (${ticket.priority.toUpperCase()} priority) created by ${creatorName}.`,
      targetType: 'all',
      createdBy: creatorUserId
    });
  } catch (notifErr) {
    console.error('IN-APP TICKET NOTIFICATION CREATION ERROR:', notifErr.message);
  }

  const ticketObj = ticket.toObject();
  if (ticketObj.attachments) ticketObj.attachments.forEach(a => delete a.data);
  if (ticketObj.supportingDocuments) ticketObj.supportingDocuments.forEach(a => delete a.data);
  if (ticketObj.adminAttachments) ticketObj.adminAttachments.forEach(a => delete a.data);

  return ticketObj;
};

export const updateTicket = async (currentUser, id, data, files = {}) => {
  if (!isValidObjectId(id)) {
    throw new Error('Invalid ticket ID');
  }

  const ticket = await Ticket.findById(id).populate([
    { path: 'createdBy', select: 'name email client clientName', populate: { path: 'client', select: 'name' } },
    { path: 'assignedTo', select: 'name email role' },
    { path: 'department', select: 'name' },
    { path: 'assignmentHistory.assignedBy', select: 'name email role' },
    { path: 'assignmentHistory.assignedTo', select: 'name email role' },
    { path: 'assignmentHistory.forwardedBy', select: 'name email role' },
    { path: 'assignmentHistory.forwardedTo', select: 'name email role' },
    { path: 'workLogs.addedBy', select: 'name email role' }
  ]);

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  const oldStatus = ticket.status;
  const creatorId = ticket.createdBy._id || ticket.createdBy;
  const isCreator = creatorId.toString() === currentUser._id.toString();
  const reqUserRole = currentUser.role?.toLowerCase() || '';
  const isAdmin = ['consultant', 'clientuser', 'superadmin'].includes(reqUserRole);

  if (!isCreator && !isAdmin) {
    throw new AppError('Permission denied', 403);
  }

  if (!isAuthorizedConsultant(currentUser, ticket)) {
    throw new AppError('Access denied: You are not assigned or associated with this ticket.', 403);
  }

  if (reqUserRole === 'clientuser') {
    if (ticket.status !== 'pending') {
      const { workLog, workLogs, remarks, solution, ...restBody } = data;
      const hasStatusChange = restBody.status && restBody.status !== ticket.status;
      const hasOtherChanges = Object.keys(restBody).some(key => key !== 'status' && key !== 'remarks');
      const hasOtherFiles = files && Object.keys(files).some(key => key !== 'remarkAttachments');

      if (hasStatusChange || hasOtherChanges || hasOtherFiles || solution || workLog || workLogs) {
        throw new AppError('You can only add messages/remarks to this ticket.', 403);
      }
    }
  }

  const { workLog, workLogs, remarks, solution, ...restBody } = data;
  
  const isWorkLogOnlyUpdate = (workLog || workLogs) && !remarks && !(files?.remarkAttachments?.length > 0);

  if (oldStatus === 'resolved') {
    const hasStatusChange = restBody.status && restBody.status.toLowerCase() !== 'resolved';
    const hasRemarks = (remarks && remarks.trim().length > 0) || (files && files.remarkAttachments && files.remarkAttachments.length > 0);
    if (hasStatusChange) {
      throw new AppError('Ticket is already resolved. Status cannot be changed.', 400);
    }
    if (hasRemarks) {
      throw new AppError('Ticket is already resolved. No further conversation is allowed.', 400);
    }
    // Allow workLog-only updates even on resolved tickets so effort hours can be corrected/added
  }
  
  if (restBody.status === 'resolved' && (!solution || solution.trim().length === 0) && !ticket.solution) {
    throw new AppError("A written 'solution' is required to mark a ticket as resolved.", 400);
  }

  Object.assign(ticket, { ...restBody, solution });

  if (remarks && typeof remarks === 'string' && remarks.trim().length > 0) {
    ticket.remarks.push({
      text: remarks,
      addedBy: currentUser._id,
      addedAt: new Date(),
      isInternal: data.isInternal === 'true' || data.isInternal === true
    });
  }

  let parsedWorkLog = workLog;
  if (typeof workLog === 'string') {
    try { parsedWorkLog = JSON.parse(workLog); } catch (e) { parsedWorkLog = null; }
  }

  let parsedWorkLogs = workLogs;
  if (typeof workLogs === 'string') {
    try { parsedWorkLogs = JSON.parse(workLogs); } catch (e) { parsedWorkLogs = null; }
  }

  if (!ticket.workLogs) ticket.workLogs = [];

  if (parsedWorkLog && parsedWorkLog.date && parsedWorkLog.hours) {
    ticket.workLogs.push({ ...parsedWorkLog, hours: Number(parsedWorkLog.hours), addedBy: currentUser._id });
  }

  if (Array.isArray(parsedWorkLogs) && parsedWorkLogs.length > 0) {
    parsedWorkLogs.forEach(log => {
      if (log.date && log.hours) {
        ticket.workLogs.push({ date: log.date, hours: Number(log.hours), addedBy: currentUser._id });
      }
    });
  }

  let isFirstResolve = false;
  if (ticket.status === 'resolved') {
    isFirstResolve = !ticket.timeToSolve;

    // Always recalculate timeToSolve whenever workLogs change on a resolved ticket
    if (ticket.workLogs && ticket.workLogs.length > 0) {
      const totalHours = ticket.workLogs.reduce((acc, log) => acc + (log.hours || 0), 0);
      ticket.timeToSolve = totalHours * 60 * 60 * 1000;
    } else if (isFirstResolve) {
      ticket.timeToSolve = new Date(ticket.actualResolutionDate || ticket.solvedAt || Date.now()).getTime() - ticket.createdAt.getTime();
    }

    if (!ticket.solvedBy) ticket.solvedBy = currentUser._id;

    // --- SUPPORT HOURS DEDUCTION ---
    try {
      const freshTicket = await Ticket.findById(ticket._id).populate({ path: 'createdBy', select: 'client' });
      const clientId = freshTicket?.createdBy?.client;
      
      if (clientId) {
        const client = await Client.findById(clientId);
        
        if (
          client &&
          client.erpDetails?.sapSupportAMCType === 'Limited' &&
          client.erpDetails?.sapSupportHourlyCap > 0
        ) {
          const totalLogged = ticket.workLogs.reduce((acc, log) => acc + (log.hours || 0), 0);
          const alreadyDeducted = ticket.hoursDeducted || 0;
          const toDeduct = parseFloat((totalLogged - alreadyDeducted).toFixed(2));

          if (toDeduct > 0) {
            client.erpDetails.hoursUsed = parseFloat(((client.erpDetails.hoursUsed || 0) + toDeduct).toFixed(2));
            ticket.hoursDeducted = parseFloat((alreadyDeducted + toDeduct).toFixed(2));
            await client.save();
            console.log(`Updated hoursUsed by ${toDeduct}h for client ${client.name}.`);
          }
        }
      }
    } catch (deductErr) {
      console.error('Incremental support hours deduction failed:', deductErr);
    }

    if (isFirstResolve && ticket.createdBy?.email) {
      sendTicketResolvedEmail(ticket.createdBy.email, ticket)
        .catch(err => console.error('RESOLVED EMAIL ERROR:', err.message));
    }
  }

  if (files) {
    const newAttachments = processFiles(files.attachments);
    if (newAttachments.length) ticket.attachments.push(...newAttachments);

    const newSupportingDocs = processFiles(files.supportingDocuments);
    if (newSupportingDocs.length) ticket.supportingDocuments.push(...newSupportingDocs);

    const newAdminAttachments = processFiles(files.adminAttachments);
    if (newAdminAttachments.length) ticket.adminAttachments.push(...newAdminAttachments);

    const newRemarkAttachments = processFiles(files.remarkAttachments);
    if (newRemarkAttachments.length && ticket.remarks.length > 0) {
      const lastRemark = ticket.remarks[ticket.remarks.length - 1];
      lastRemark.attachments = newRemarkAttachments;
    }
  }

  const statusChanged = ticket.status !== oldStatus;
  const finalNewStatus = ticket.status;

  await ticket.save();

  if (statusChanged) {
    try {
      const updatedTicket = await Ticket.findById(ticket._id)
        .populate({ path: 'createdBy', select: 'name email client', populate: { path: 'client', select: 'name contactEmail' } })
        .populate({ path: 'assignedTo', select: 'name email role' });

      if (updatedTicket.createdBy?.email) {
        const clientContactEmail = updatedTicket.createdBy?.client?.contactEmail || null;
        sendTicketStatusUpdatedEmail(
          updatedTicket.createdBy.email,
          clientContactEmail,
          updatedTicket,
          oldStatus,
          finalNewStatus,
          currentUser
        ).catch(err => console.error('STATUS CHANGE EMAIL TO USER FAILED:', err.message));
      }

      if (updatedTicket.assignedTo?.email) {
        sendTicketStatusUpdatedEmail(
          updatedTicket.assignedTo.email,
          null,
          updatedTicket,
          oldStatus,
          finalNewStatus,
          currentUser
        ).catch(err => console.error('STATUS CHANGE EMAIL TO CONSULTANT FAILED:', err.message));
      }
    } catch (err) {
      console.error('Failed to dispatch status change emails:', err);
    }
  }

  if (remarks && typeof remarks === 'string' && remarks.trim().length > 0) {
    const updatedTicket = await Ticket.findById(ticket._id)
      .populate({ path: 'createdBy', select: 'name email clientName client', populate: { path: 'client', select: 'name contactEmail' } })
      .populate({ path: 'assignedTo', select: 'name email role' })
      .populate({ path: 'department', select: 'name' });

    const senderRole = currentUser.role?.toLowerCase() || '';
    const isSenderAdmin = ['consultant', 'clientuser', 'superadmin'].includes(senderRole);

    if (isSenderAdmin) {
      if (updatedTicket.createdBy?.email) {
        sendNewMessageNotificationEmail(
          updatedTicket.createdBy.email,
          updatedTicket,
          remarks,
          currentUser,
          'clientuser'
        ).catch(err => console.error('CONVERSATION EMAIL TO CLIENT USER FAILED:', err.message));
      }
    } else {
      if (updatedTicket.assignedTo?.email) {
        sendNewMessageNotificationEmail(
          updatedTicket.assignedTo.email,
          updatedTicket,
          remarks,
          currentUser,
          updatedTicket.assignedTo.role || 'consultant'
        ).catch(err => console.error('CONVERSATION EMAIL TO CONSULTANT FAILED:', err.message));
      } else {
        try {
          const recipients = [];
          if (updatedTicket.department) {
            const consultantProfiles = await ConsultantProfile.find({
              department: updatedTicket.department._id || updatedTicket.department
            }).populate('user', 'email role');
            consultantProfiles.forEach(p => {
              if (p.user?.email) {
                recipients.push({ email: p.user.email, role: p.user.role || 'consultant' });
              }
            });
          }
          const superAdmins = await ClientUser.find({ role: 'superadmin', status: 'active' });
          superAdmins.forEach(u => {
            if (u.email) {
              recipients.push({ email: u.email, role: 'superadmin' });
            }
          });

          const uniqueRecipients = [];
          const seenEmails = new Set();
          for (const r of recipients) {
            if (!seenEmails.has(r.email)) {
              seenEmails.add(r.email);
              uniqueRecipients.push(r);
            }
          }

          for (const recipient of uniqueRecipients) {
            sendNewMessageNotificationEmail(
              recipient.email,
              updatedTicket,
              remarks,
              currentUser,
              recipient.role
            ).catch(err => console.error(`CONVERSATION EMAIL FAILED:`, err.message));
          }
        } catch (err) {
          console.error('Failed to notify admins:', err);
        }
      }
    }
  }
  
  return await Ticket.findById(ticket._id).populate([
    { path: 'createdBy', select: 'name email clientName client', populate: { path: 'client', select: 'name' } },
    { path: 'assignedTo', select: 'name email role' },
    { path: 'solvedBy', select: 'name email' },
    { path: 'department', select: 'name description categories' },
    { path: 'remarks.addedBy', select: 'name email role' },
    { path: 'assignmentHistory.assignedBy', select: 'name email role' },
    { path: 'assignmentHistory.assignedTo', select: 'name email role' },
    { path: 'assignmentHistory.forwardedBy', select: 'name email role' },
    { path: 'assignmentHistory.forwardedTo', select: 'name email role' },
    { path: 'workLogs.addedBy', select: 'name email role' }
  ]);
};

export const deleteTicket = async (id) => {
  if (!isValidObjectId(id)) {
    throw new AppError('Invalid ticket ID', 400);
  }

  const ticket = await Ticket.findByIdAndDelete(id);
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }
};

export const submitFeedback = async (currentUser, id, rating, comment) => {
  if (!isValidObjectId(id)) {
    throw new AppError('Invalid ticket ID', 400);
  }

  const ticket = await Ticket.findById(id);
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  if (ticket.createdBy.toString() !== currentUser._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  ticket.feedback = {
    rating,
    comment,
    submittedAt: new Date()
  };

  await ticket.save();
  return ticket.feedback;
};

export const getDashboardStats = async (filters = {}) => {
  const { startDate, endDate } = filters;
  const dateQuery = {};
  if (startDate && endDate) {
    dateQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const tickets = await Ticket.find(dateQuery, 'status timeToSolve feedback actualResolutionDate solvedAt updatedAt createdAt priority department')
    .populate({ path: 'department', select: 'name' });

  const total = tickets.length;
  const pending = tickets.filter(t => t.status?.toLowerCase() === 'pending').length;
  const resolved = tickets.filter(t => t.status?.toLowerCase() === 'resolved').length;

  const resolvedTickets = tickets.filter(t => t.status?.toLowerCase() === 'resolved');
  const totalMs = resolvedTickets.reduce((sum, t) => {
    let duration = t.timeToSolve;
    if (!duration || duration <= 0) {
      const endTime = t.actualResolutionDate || t.solvedAt || t.updatedAt || new Date();
      duration = new Date(endTime).getTime() - new Date(t.createdAt).getTime();
    }
    return sum + Math.max(0, duration);
  }, 0);

  const avgResolutionTime = resolvedTickets.length > 0
    ? (totalMs / resolvedTickets.length) / 60000
    : 0;

  const ratedTickets = tickets.filter(t => t.feedback?.rating > 0);
  const avgRating = ratedTickets.length > 0
    ? ratedTickets.reduce((sum, t) => sum + t.feedback.rating, 0) / ratedTickets.length
    : 0;

  // Additional stats breakdowns
  const priorityBreakdown = {
    critical: tickets.filter(t => t.priority?.toLowerCase() === 'critical').length,
    high: tickets.filter(t => t.priority?.toLowerCase() === 'high').length,
    medium: tickets.filter(t => t.priority?.toLowerCase() === 'medium').length,
    low: tickets.filter(t => t.priority?.toLowerCase() === 'low').length,
  };

  const statusBreakdown = {
    pending,
    assigned: tickets.filter(t => t.status?.toLowerCase() === 'assigned').length,
    resolved,
    closed: tickets.filter(t => t.status?.toLowerCase() === 'closed').length,
    hold: tickets.filter(t => t.status?.toLowerCase() === 'hold' || t.status?.toLowerCase() === 'on hold').length,
    cancelled: tickets.filter(t => t.status?.toLowerCase() === 'cancelled').length,
  };

  const deptCounts = {};
  tickets.forEach(t => {
    const deptName = t.department?.name || 'Unassigned';
    deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
  });
  const departmentBreakdown = Object.entries(deptCounts).map(([name, count]) => ({ name, count }));

  return {
    total,
    pending,
    resolved,
    avgResolutionTime: +avgResolutionTime.toFixed(1),
    avgRating: +avgRating.toFixed(2),
    totalRatings: ratedTickets.length,
    priorityBreakdown,
    statusBreakdown,
    departmentBreakdown
  };
};

export const markTicketAsOpened = async (currentUser, id) => {
  if (!isValidObjectId(id)) {
    throw new AppError('Invalid ticket ID', 400);
  }

  const ticket = await Ticket.findById(id);
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  const role = currentUser.role?.toLowerCase()?.replace(/\s+/g, '') || '';
  if (['superadmin', 'consultant', 'admin'].includes(role)) {
    if (!ticket.openedBy) {
      ticket.openedBy = [];
    }
    const hasOpened = ticket.openedBy.some(userId => userId.toString() === currentUser._id.toString());
    if (!hasOpened) {
      ticket.openedBy.push(currentUser._id);
      await ticket.save();
    }
  }

  const populated = await Ticket.findById(id).populate([
    { path: 'createdBy', select: 'name email clientName client', populate: { path: 'client', select: 'name' } },
    { path: 'assignedTo', select: 'name email role' },
    { path: 'solvedBy', select: 'name email' },
    { path: 'department', select: 'name description categories' },
    { path: 'remarks.addedBy', select: 'name email role' },
    { path: 'assignmentHistory.assignedBy', select: 'name email role' },
    { path: 'assignmentHistory.assignedTo', select: 'name email role' },
    { path: 'assignmentHistory.forwardedBy', select: 'name email role' },
    { path: 'assignmentHistory.forwardedTo', select: 'name email role' }
  ]).select('-attachments.data -adminAttachments.data -supportingDocuments.data');

  const tObj = populated.toObject();
  return {
    ...tObj,
    attachmentCount: populated.attachments?.length || 0
  };
};

export const updateTicketStatusPatch = async (currentUser, id, { status, solution }) => {
  if (!isValidObjectId(id)) {
    throw new AppError('Invalid ticket ID', 400);
  }

  const ticket = await Ticket.findById(id).populate([
    { path: 'createdBy', select: 'name email client clientName' },
    { path: 'assignedTo', select: 'name email role' },
    { path: 'department', select: 'name' },
    { path: 'assignmentHistory.assignedBy', select: 'name email role' },
    { path: 'assignmentHistory.assignedTo', select: 'name email role' },
    { path: 'assignmentHistory.forwardedBy', select: 'name email role' },
    { path: 'assignmentHistory.forwardedTo', select: 'name email role' },
    { path: 'workLogs.addedBy', select: 'name email role' }
  ]);
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  if (!isAuthorizedConsultant(currentUser, ticket)) {
    throw new AppError('Access denied: You are not assigned or associated with this ticket.', 403);
  }

  if (ticket.status === 'resolved') {
    throw new AppError('Ticket is already resolved. Status cannot be changed.', 400);
  }

  const oldStatus = ticket.status;

  ticket.status = status;
  if (solution) ticket.solution = solution;

  let supportWarning = null;

  if (status === 'resolved') {
    const now = new Date();
    ticket.solvedAt = now;
    ticket.solvedBy = currentUser._id;
    const msElapsed = now - ticket.createdAt;
    ticket.timeToSolve = msElapsed;

    try {
      const clientId = ticket.createdBy?.client;
      if (clientId) {
        const client = await Client.findById(clientId);
        if (
          client &&
          client.erpDetails?.sapSupportAMCType === 'Limited' &&
          client.erpDetails?.sapSupportHourlyCap > 0
        ) {
          const totalLogged = ticket.workLogs.reduce((acc, log) => acc + (log.hours || 0), 0);
          const alreadyDeducted = ticket.hoursDeducted || 0;
          const toDeduct = parseFloat((totalLogged - alreadyDeducted).toFixed(2));

          if (toDeduct > 0) {
            client.erpDetails.hoursUsed = parseFloat(((client.erpDetails.hoursUsed || 0) + toDeduct).toFixed(2));
            ticket.hoursDeducted = parseFloat((alreadyDeducted + toDeduct).toFixed(2));
            await client.save();
            console.log(`Updated hoursUsed by ${toDeduct}h for client ${client.name} via status change.`);
          }
        }
      }
    } catch (deductErr) {
      console.error('Status deduction failed:', deductErr);
    }
    
    if (ticket.createdBy?.email) {
      sendTicketResolvedEmail(ticket.createdBy.email, ticket)
        .catch(err => console.error(err));
    }
  }

  const statusChanged = ticket.status !== oldStatus;

  await ticket.save();

  if (statusChanged) {
    try {
      const updatedTicket = await Ticket.findById(ticket._id)
        .populate({ path: 'createdBy', select: 'name email client', populate: { path: 'client', select: 'name contactEmail' } })
        .populate({ path: 'assignedTo', select: 'name email role' });

      if (updatedTicket.createdBy?.email) {
        const clientContactEmail = updatedTicket.createdBy?.client?.contactEmail || null;
        sendTicketStatusUpdatedEmail(
          updatedTicket.createdBy.email,
          clientContactEmail,
          updatedTicket,
          oldStatus,
          status,
          currentUser
        ).catch(err => console.error('STATUS CHANGE EMAIL TO USER FAILED:', err.message));
      }

      if (updatedTicket.assignedTo?.email) {
        sendTicketStatusUpdatedEmail(
          updatedTicket.assignedTo.email,
          null,
          updatedTicket,
          oldStatus,
          status,
          currentUser
        ).catch(err => console.error('STATUS CHANGE EMAIL TO CONSULTANT FAILED:', err.message));
      }
    } catch (err) {
      console.error('Failed to dispatch status change emails:', err);
    }
  }

  return { ticket, supportWarning };
};

export const addRemarkOnly = async (currentUser, id, text, isInternal = false) => {
  if (!isValidObjectId(id)) {
    throw new AppError('Invalid ticket ID', 400);
  }

  const ticket = await Ticket.findById(id).populate([
    { path: 'createdBy', select: 'name email clientName client' },
    { path: 'assignedTo', select: 'name email role' },
    { path: 'department', select: 'name' },
    { path: 'assignmentHistory.assignedBy', select: 'name email role' },
    { path: 'assignmentHistory.assignedTo', select: 'name email role' },
    { path: 'assignmentHistory.forwardedBy', select: 'name email role' },
    { path: 'assignmentHistory.forwardedTo', select: 'name email role' }
  ]);
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  if (ticket.status === 'resolved') {
    throw new AppError('Ticket is already resolved. No further conversation is allowed.', 400);
  }

  const reqUserRole = currentUser.role?.toLowerCase() || '';
  const isAdmin = ['consultant', 'clientuser', 'superadmin'].includes(reqUserRole);

  if (reqUserRole === 'clientuser') {
    const hasAccess = await checkClientUserAccess(currentUser, ticket);
    if (!hasAccess) {
      throw new AppError('Access denied: You do not have permission to access this ticket.', 403);
    }
  }

  if (!isAuthorizedConsultant(currentUser, ticket)) {
    throw new AppError('Access denied: You are not assigned or associated with this ticket.', 403);
  }

  if (!isAdmin) {
    const creatorId = ticket.createdBy?._id || ticket.createdBy;
    if (String(creatorId) !== String(currentUser._id)) {
      throw new AppError('Access denied: This is not your ticket.', 403);
    }
  }

  ticket.remarks.push({
    text,
    addedBy: currentUser._id,
    isInternal: isInternal === 'true' || isInternal === true
  });

  await ticket.save();

  const updatedTicket = await Ticket.findById(ticket._id)
    .populate({ path: 'createdBy', select: 'name email client', populate: { path: 'client', select: 'name contactEmail' } })
    .populate({ path: 'assignedTo', select: 'name email role' })
    .populate({ path: 'department', select: 'name' });

  const senderRole = currentUser.role?.toLowerCase() || '';
  const isSenderAdmin = ['consultant', 'clientuser', 'superadmin'].includes(senderRole);

  if (isSenderAdmin) {
    if (updatedTicket.createdBy?.email && !isInternal) {
      sendNewMessageNotificationEmail(
        updatedTicket.createdBy.email,
        updatedTicket,
        text,
        currentUser,
        'clientuser'
      ).catch(err => console.error('CONVERSATION EMAIL TO CLIENT USER FAILED:', err.message));
    }
  } else {
    if (updatedTicket.assignedTo?.email) {
      sendNewMessageNotificationEmail(
        updatedTicket.assignedTo.email,
        updatedTicket,
        text,
        currentUser,
        updatedTicket.assignedTo.role || 'consultant'
      ).catch(err => console.error('CONVERSATION EMAIL TO CONSULTANT FAILED:', err.message));
    } else {
      try {
        const recipients = [];
        if (updatedTicket.department) {
          const consultantProfiles = await ConsultantProfile.find({
            department: updatedTicket.department._id || updatedTicket.department
          }).populate('user', 'email role');
          consultantProfiles.forEach(p => {
            if (p.user?.email) {
              recipients.push({ email: p.user.email, role: p.user.role || 'consultant' });
            }
          });
        }
        const superAdmins = await ClientUser.find({ role: 'superadmin', status: 'active' });
        superAdmins.forEach(u => {
          if (u.email) {
            recipients.push({ email: u.email, role: 'superadmin' });
          }
        });

        const uniqueRecipients = [];
        const seenEmails = new Set();
        for (const r of recipients) {
          if (!seenEmails.has(r.email)) {
            seenEmails.add(r.email);
            uniqueRecipients.push(r);
          }
        }

        for (const recipient of uniqueRecipients) {
          sendNewMessageNotificationEmail(
            recipient.email,
            updatedTicket,
            text,
            currentUser,
            recipient.role
          ).catch(err => console.error(`CONVERSATION EMAIL FAILED:`, err.message));
        }
      } catch (err) {
        console.error('Failed to notify admins:', err);
      }
    }
  }

  return ticket;
};

export const assignTicket = async (currentUser, id, consultantId, remarks, ccConsultantIds = []) => {
  if (currentUser.role !== 'superadmin') {
    throw new AppError('Only Super Admin can assign tickets.', 403);
  }

  if (!isValidObjectId(id) || !isValidObjectId(consultantId)) {
    throw new AppError('Invalid ticket ID or consultant ID.', 400);
  }

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new AppError('Ticket not found.', 404);

  const targetConsultant = await ClientUser.findById(consultantId);
  if (!targetConsultant || !['consultant', 'clientuser', 'superadmin'].includes(targetConsultant.role)) {
    throw new AppError('Target user is not a Consultant.', 400);
  }

  const targetOnLeave = await checkConsultantOnLeave(consultantId);
  if (targetOnLeave) {
    throw new AppError('Target consultant is currently on approved leave and cannot be assigned new tickets.', 422);
  }

  ticket.assignedTo = targetConsultant._id;
  ticket.status = 'assigned';
  ticket.openedBy = (ticket.openedBy || []).filter(id => id && String(id) !== String(targetConsultant._id));
  if (!ticket.assignmentHistory) ticket.assignmentHistory = [];
  ticket.assignmentHistory.push({
    action: 'assign',
    assignedBy: currentUser._id,
    assignedTo: targetConsultant._id,
    actionDate: new Date(),
    remarks: remarks || ''
  });

  await ticket.save();

  const populated = await Ticket.findById(ticket._id).populate([
    { path: 'createdBy', select: 'name email clientName client', populate: { path: 'client', select: 'name' } },
    { path: 'assignedTo', select: 'name email role' },
    { path: 'solvedBy', select: 'name email' },
    { path: 'department', select: 'name description categories' },
    { path: 'remarks.addedBy', select: 'name email role' },
    { path: 'assignmentHistory.assignedBy', select: 'name email role' },
    { path: 'assignmentHistory.assignedTo', select: 'name email role' },
    { path: 'assignmentHistory.forwardedBy', select: 'name email role' },
    { path: 'assignmentHistory.forwardedTo', select: 'name email role' },
    { path: 'workLogs.addedBy', select: 'name email role' }
  ]);

  let manualCCEmails = [];
  if (ccConsultantIds && ccConsultantIds.length > 0) {
    const consultants = await ClientUser.find({ _id: { $in: ccConsultantIds } }, 'email');
    manualCCEmails = consultants.map(c => c.email).filter(Boolean);
  }

  if (populated.assignedTo?.email) {
    sendTicketAssignedConsultantEmail(
      populated.assignedTo.email,
      populated,
      currentUser,
      populated.assignedTo,
      remarks,
      manualCCEmails.length > 0 ? manualCCEmails : null
    ).catch(err => console.error('ASSIGN EMAIL ERROR:', err.message));
  }

  return populated;
};

export const forwardTicket = async (currentUser, id, consultantId, remarks, ccConsultantIds = []) => {
  const lowerRole = currentUser.role?.toLowerCase() || '';
  if (!['consultant', 'clientuser', 'superadmin'].includes(lowerRole)) {
    throw new AppError('Only Consultants or Super Admins can forward tickets.', 403);
  }

  if (!isValidObjectId(id) || !isValidObjectId(consultantId)) {
    throw new AppError('Invalid ticket ID or consultant ID.', 400);
  }

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new AppError('Ticket not found.', 404);

  const isSuperAdmin = lowerRole === 'superadmin';
  const isAssignedConsultant = (lowerRole === 'consultant' || lowerRole === 'admin') && String(ticket.assignedTo) === String(currentUser._id);

  if (!isSuperAdmin && !isAssignedConsultant) {
    throw new AppError('Only the currently assigned Consultant or a Super Admin can forward this ticket.', 403);
  }

  const targetConsultant = await ClientUser.findById(consultantId);
  if (!targetConsultant || !['consultant', 'clientuser', 'superadmin'].includes(targetConsultant.role)) {
    throw new AppError('Target user is not a Consultant.', 400);
  }

  const targetOnLeave = await checkConsultantOnLeave(consultantId);
  if (targetOnLeave) {
    throw new AppError('Target consultant is currently on approved leave and cannot be assigned new tickets.', 422);
  }

  const previousAssignee = ticket.assignedTo;

  ticket.assignedTo = targetConsultant._id;
  ticket.status = 'assigned';
  ticket.openedBy = (ticket.openedBy || []).filter(id => id && String(id) !== String(targetConsultant._id));
  if (!ticket.assignmentHistory) ticket.assignmentHistory = [];
  ticket.assignmentHistory.push({
    action: 'forward',
    forwardedBy: currentUser._id,
    forwardedTo: targetConsultant._id,
    assignedBy: previousAssignee,
    assignedTo: targetConsultant._id,
    actionDate: new Date(),
    remarks: remarks || ''
  });

  await ticket.save();

  const populated = await Ticket.findById(ticket._id).populate([
    { path: 'createdBy', select: 'name email clientName client', populate: { path: 'client', select: 'name contactEmail contactPerson' } },
    { path: 'assignedTo', select: 'name email role' },
    { path: 'solvedBy', select: 'name email' },
    { path: 'department', select: 'name description categories' },
    { path: 'remarks.addedBy', select: 'name email role' },
    { path: 'assignmentHistory.assignedBy', select: 'name email role' },
    { path: 'assignmentHistory.assignedTo', select: 'name email role' },
    { path: 'assignmentHistory.forwardedBy', select: 'name email role' },
    { path: 'assignmentHistory.forwardedTo', select: 'name email role' },
    { path: 'workLogs.addedBy', select: 'name email role' }
  ]);

  let manualCCEmails = [];
  if (ccConsultantIds && ccConsultantIds.length > 0) {
    const objectIds = ccConsultantIds.filter(val => isValidObjectId(val));
    const rawEmails = ccConsultantIds.filter(val => typeof val === 'string' && val.includes('@') && !isValidObjectId(val));
    
    if (objectIds.length > 0) {
      const consultants = await ClientUser.find({ _id: { $in: objectIds } }, 'email');
      manualCCEmails = consultants.map(c => c.email).filter(Boolean);
    }
    
    manualCCEmails = [...manualCCEmails, ...rawEmails];
  }

  if (['superadmin', 'consultant', 'admin'].includes(currentUser.role?.toLowerCase())) {
    if (populated.createdBy?.email) {
      const clientContactEmail = populated.createdBy?.client?.contactEmail || null;
      sendTicketForwardedUserEmail(
        populated.createdBy.email,
        populated,
        currentUser,
        targetConsultant,
        remarks || '',
        clientContactEmail
      ).catch(err => console.error('FORWARD USER EMAIL ERROR:', err.message));
    }

    if (targetConsultant.email) {
      sendTicketForwardedConsultantEmail(
        targetConsultant.email,
        populated,
        currentUser,
        targetConsultant,
        remarks || '',
        manualCCEmails.length > 0 ? manualCCEmails : null
      ).catch(err => console.error('FORWARD CONSULTANT EMAIL ERROR:', err.message));
    }
  }

  return populated;
};

export const getAttachments = async (currentUser, ticketId) => {
  if (!isValidObjectId(ticketId)) {
    throw new AppError('Invalid ticket ID', 400);
  }

  const ticket = await Ticket.findById(ticketId)
    .populate([
      { path: 'assignmentHistory.assignedBy', select: 'name email role' },
      { path: 'assignmentHistory.assignedTo', select: 'name email role' },
      { path: 'assignmentHistory.forwardedBy', select: 'name email role' },
      { path: 'assignmentHistory.forwardedTo', select: 'name email role' }
    ])
    .select('attachments createdBy assignedTo assignmentHistory department');
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  const hasAccess = await checkClientUserAccess(currentUser, ticket);
  if (!hasAccess) {
    throw new AppError('Access denied', 403);
  }

  if (!isAuthorizedConsultant(currentUser, ticket)) {
    throw new AppError('Access denied: You are not assigned or associated with this ticket.', 403);
  }

  return ticket.attachments.map(att => ({
    _id: att._id,
    filename: att.filename,
    originalName: att.originalName,
    mimeType: att.mimeType,
    size: att.size,
    uploadedAt: att.uploadedAt
  }));
};

export const downloadAttachment = async (currentUser, ticketId, attachmentId) => {
  if (!isValidObjectId(ticketId) || !isValidObjectId(attachmentId)) {
    throw new AppError('Invalid ID format', 400);
  }

  const ticket = await Ticket.findById(ticketId)
    .populate([
      { path: 'assignmentHistory.assignedBy', select: 'name email role' },
      { path: 'assignmentHistory.assignedTo', select: 'name email role' },
      { path: 'assignmentHistory.forwardedBy', select: 'name email role' },
      { path: 'assignmentHistory.forwardedTo', select: 'name email role' }
    ])
    .select('+attachments.data +supportingDocuments.data +adminAttachments.data +remarks.attachments.data +department +assignedTo +assignmentHistory');
  
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  let attachment = ticket.attachments.id(attachmentId) || 
                     ticket.supportingDocuments?.id(attachmentId) || 
                     ticket.adminAttachments?.id(attachmentId);

  let isInternalRemarkAttachment = false;
  if (!attachment && ticket.remarks) {
    for (const remark of ticket.remarks) {
      if (remark.attachments) {
        const found = remark.attachments.id(attachmentId);
        if (found) { 
          attachment = found; 
          isInternalRemarkAttachment = remark.isInternal;
          break; 
        }
      }
    }
  }

  if (!attachment) {
    throw new AppError('Attachment not found', 404);
  }

  const hasAccess = await checkClientUserAccess(currentUser, ticket);
  if (!hasAccess) {
    throw new AppError('Access denied', 403);
  }

  if (currentUser.role === 'clientuser' && isInternalRemarkAttachment) {
    throw new AppError('Access denied: This is an internal attachment.', 403);
  }

  if (!isAuthorizedConsultant(currentUser, ticket)) {
    throw new AppError('Access denied: You are not assigned or associated with this ticket.', 403);
  }

  return attachment;
};

export const addAttachmentsToTicket = async (currentUser, ticketId, filesList) => {
  if (!isValidObjectId(ticketId)) {
    throw new AppError('Invalid ticket ID', 400);
  }

  const ticket = await Ticket.findById(ticketId).populate([
    { path: 'assignmentHistory.assignedBy', select: 'name email role' },
    { path: 'assignmentHistory.assignedTo', select: 'name email role' },
    { path: 'assignmentHistory.forwardedBy', select: 'name email role' },
    { path: 'assignmentHistory.forwardedTo', select: 'name email role' }
  ]);
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  const hasAccess = await checkClientUserAccess(currentUser, ticket);
  if (!hasAccess) {
    throw new AppError('Access denied', 403);
  }

  if (!isAuthorizedConsultant(currentUser, ticket)) {
    throw new AppError('Access denied: You are not assigned or associated with this ticket.', 403);
  }

  if (!filesList?.length) {
    throw new AppError('No files uploaded', 400);
  }

  const newAttachments = filesList.map(file => ({
    filename: `${Date.now()}-${file.originalname}`,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    data: file.buffer,
    uploadedAt: new Date()
  }));

  ticket.attachments.push(...newAttachments);
  await ticket.save();

  return newAttachments.length;
};

export const deleteAttachmentFromTicket = async (currentUser, ticketId, attachmentId) => {
  if (!isValidObjectId(ticketId) || !isValidObjectId(attachmentId)) {
    throw new AppError('Invalid ID format', 400);
  }

  const ticket = await Ticket.findById(ticketId).populate([
    { path: 'assignmentHistory.assignedBy', select: 'name email role' },
    { path: 'assignmentHistory.assignedTo', select: 'name email role' },
    { path: 'assignmentHistory.forwardedBy', select: 'name email role' },
    { path: 'assignmentHistory.forwardedTo', select: 'name email role' }
  ]);
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  const hasAccess = await checkClientUserAccess(currentUser, ticket);
  if (!hasAccess) {
    throw new AppError('Access denied', 403);
  }

  if (!isAuthorizedConsultant(currentUser, ticket)) {
    throw new AppError('Access denied: You are not assigned or associated with this ticket.', 403);
  }

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

  if (!attachment) {
    throw new AppError('Attachment not found', 404);
  }

  targetArray.pull(attachmentId);
  await ticket.save();
};
