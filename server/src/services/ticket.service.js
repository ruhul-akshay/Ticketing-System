import Ticket from '../models/Ticket.js';
import ClientUser from '../models/ClientUser.js';
import ConsultantProfile from '../models/ConsultantProfile.js';
import Client from '../models/Client.js';
import PreAssignmentRule from '../models/PreAssignmentRule.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { generateTicketNumber, isValidObjectId } from '../utils/ticket.helpers.js';
import Holiday from '../models/Holiday.js';

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

export const getTickets = async (currentUser) => {
  const query = {};

  if (currentUser.role === 'clientuser') {
    query.createdBy = currentUser._id;
  }

  if (currentUser.role === 'consultant' || currentUser.role === 'admin') {
    query.$or = [
      { assignedTo: currentUser._id },
      { 'assignmentHistory.forwardedBy': currentUser._id },
      { 'assignmentHistory.forwardedTo': currentUser._id }
    ];
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
      { path: 'assignmentHistory.forwardedTo', select: 'name email role' }
    ])
    .select('-attachments.data -adminAttachments.data -supportingDocuments.data')
    .sort({ createdAt: -1 });

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
    query.createdBy = currentUser._id;
  }

  if (currentUser.role === 'consultant' || currentUser.role === 'admin') {
    query.$or = [
      { assignedTo: currentUser._id },
      { 'assignmentHistory.forwardedBy': currentUser._id },
      { 'assignmentHistory.forwardedTo': currentUser._id }
    ];
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
    throw new Error('Invalid ticket ID');
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
    throw new Error('Ticket not found');
  }

  if (currentUser.role === 'clientuser' && ticket.createdBy._id.toString() !== currentUser._id.toString()) {
    throw new Error('Access denied');
  }

  const isAssigned = ticket.assignedTo && ticket.assignedTo._id.toString() === currentUser._id.toString();
  const isAssociated = ticket.assignmentHistory?.some(h => 
    (h.forwardedBy && h.forwardedBy.toString() === currentUser._id.toString()) || 
    (h.forwardedTo && h.forwardedTo.toString() === currentUser._id.toString())
  );

  if ((currentUser.role === 'consultant' || currentUser.role === 'admin') && !isAssigned && !isAssociated) {
    throw new Error('Access denied: You are not assigned or associated with this ticket.');
  }

  const ticketObj = ticket.toObject();
  if (currentUser.role === 'clientuser' && ticketObj.remarks) {
    ticketObj.remarks = ticketObj.remarks.filter(r => !r.isInternal);
  }

  return ticketObj;
};

export const createTicket = async (currentUser, data, files = {}) => {
  const { title, description, priority = 'medium', department, category, reason, ccEmails, erpIncidentType } = data;

  if (!title?.trim()) throw new Error('Title is required');
  if (!description?.trim()) throw new Error('Description is required');
  if (!department) throw new Error('Department is required');

  const departmentId = isValidObjectId(department) ? department : null;
  const ticketNumber = await generateTicketNumber(departmentId);

  const processFiles = (fileArray) => fileArray?.map(file => ({
    filename: `${Date.now()}-${file.originalname}`,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    data: file.buffer,
    uploadedAt: new Date()
  })) || [];

  const attachments = processFiles(files.attachments);
  const supportingDocuments = processFiles(files.supportingDocuments);
  const adminAttachments = processFiles(files.adminAttachments);

  const creatorUserId = ['consultant', 'clientuser', 'superadmin'].includes(currentUser.role) && data.createdBy ? data.createdBy : currentUser._id;
  const creatorUser = await ClientUser.findById(creatorUserId).populate('client');

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

  if (matchedRule) {
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
    ccEmails: Array.isArray(ccEmails) ? ccEmails.filter(Boolean) : (ccEmails ? [ccEmails] : []),
    erpIncidentType: erpIncidentType || null
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
    { path: 'department', select: 'name' }
  ]);

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  const oldStatus = ticket.status;
  const creatorId = ticket.createdBy._id || ticket.createdBy;
  const isCreator = creatorId.toString() === currentUser._id.toString();
  const reqUserRole = currentUser.role?.toLowerCase() || '';
  const isAdmin = ['consultant', 'clientuser', 'superadmin'].includes(reqUserRole);

  if (!isCreator && !isAdmin) {
    throw new Error('Permission denied');
  }

  const isAssigned = ticket.assignedTo && String(ticket.assignedTo?._id || ticket.assignedTo) === String(currentUser._id);
  const isAssociated = ticket.assignmentHistory?.some(h => 
    (h.forwardedBy && h.forwardedBy.toString() === currentUser._id.toString()) || 
    (h.forwardedTo && h.forwardedTo.toString() === currentUser._id.toString())
  );
  const isAuthorizedConsultant = (reqUserRole === 'consultant' || reqUserRole === 'admin') && (isAssigned || isAssociated);

  if ((reqUserRole === 'consultant' || reqUserRole === 'admin') && !isAuthorizedConsultant) {
    throw new Error('Access denied: You are not assigned or associated with this ticket.');
  }

  if (reqUserRole === 'clientuser') {
    if (ticket.status !== 'pending') {
      const { workLog, workLogs, remarks, solution, ...restBody } = data;
      const hasStatusChange = restBody.status && restBody.status !== ticket.status;
      const hasOtherChanges = Object.keys(restBody).some(key => key !== 'status' && key !== 'remarks');
      const hasOtherFiles = files && Object.keys(files).some(key => key !== 'remarkAttachments');

      if (hasStatusChange || hasOtherChanges || hasOtherFiles || solution || workLog || workLogs) {
        throw new Error('You can only add messages/remarks to this ticket.');
      }
    }
  }

  const { workLog, workLogs, remarks, solution, ...restBody } = data;
  
  if (restBody.status === 'resolved' && (!solution || solution.trim().length === 0) && !ticket.solution) {
    throw new Error("A written 'solution' is required to mark a ticket as resolved.");
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
    const processFiles = (fileArray) => fileArray?.map(file => ({
      filename: `${Date.now()}-${file.originalname}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      data: file.buffer,
      uploadedAt: new Date()
    })) || [];

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
    { path: 'assignmentHistory.forwardedTo', select: 'name email role' }
  ]);
};

export const deleteTicket = async (id) => {
  if (!isValidObjectId(id)) {
    throw new Error('Invalid ID');
  }

  const ticket = await Ticket.findByIdAndDelete(id);
  if (!ticket) {
    throw new Error('Ticket not found');
  }
};

export const submitFeedback = async (currentUser, id, rating, comment) => {
  if (!isValidObjectId(id)) {
    throw new Error('Invalid ID');
  }

  const ticket = await Ticket.findById(id);
  if (!ticket) {
    throw new Error('Ticket not found');
  }

  if (ticket.createdBy.toString() !== currentUser._id.toString()) {
    throw new Error('Access denied');
  }

  ticket.feedback = {
    rating,
    comment,
    submittedAt: new Date()
  };

  await ticket.save();
  return ticket.feedback;
};

export const getDashboardStats = async () => {
  const tickets = await Ticket.find({}, 'status timeToSolve feedback actualResolutionDate solvedAt updatedAt createdAt');

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

  return {
    total,
    pending,
    resolved,
    avgResolutionTime: +avgResolutionTime.toFixed(1),
    avgRating: +avgRating.toFixed(2),
    totalRatings: ratedTickets.length
  };
};

export const updateTicketStatusPatch = async (currentUser, id, { status, solution }) => {
  if (!isValidObjectId(id)) {
    throw new Error('Invalid ID');
  }

  const ticket = await Ticket.findById(id).populate({
    path: 'createdBy',
    select: 'name email client clientName'
  });
  if (!ticket) {
    throw new Error('Ticket not found');
  }

  const isAssigned = ticket.assignedTo && String(ticket.assignedTo?._id || ticket.assignedTo) === String(currentUser._id);
  const isAssociated = ticket.assignmentHistory?.some(h => 
    (h.forwardedBy && h.forwardedBy.toString() === currentUser._id.toString()) || 
    (h.forwardedTo && h.forwardedTo.toString() === currentUser._id.toString())
  );
  const isAuthorizedConsultant = (currentUser.role === 'consultant' || currentUser.role === 'admin') && (isAssigned || isAssociated);

  if ((currentUser.role === 'consultant' || currentUser.role === 'admin') && !isAuthorizedConsultant) {
    throw new Error('Access denied: You are not assigned or associated with this ticket.');
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
    throw new Error('Invalid ID');
  }

  const ticket = await Ticket.findById(id).populate('assignedTo').populate('createdBy');
  if (!ticket) {
    throw new Error('Ticket not found');
  }

  const reqUserRole = currentUser.role?.toLowerCase() || '';
  const isAdmin = ['consultant', 'clientuser', 'superadmin'].includes(reqUserRole);

  const isAssigned = ticket.assignedTo && String(ticket.assignedTo?._id || ticket.assignedTo) === String(currentUser._id);
  const isAssociated = ticket.assignmentHistory?.some(h => 
    (h.forwardedBy && h.forwardedBy.toString() === currentUser._id.toString()) || 
    (h.forwardedTo && h.forwardedTo.toString() === currentUser._id.toString())
  );
  const isAuthorizedConsultant = (reqUserRole === 'consultant' || reqUserRole === 'admin') && (isAssigned || isAssociated);

  if ((reqUserRole === 'consultant' || reqUserRole === 'admin') && !isAuthorizedConsultant) {
    throw new Error('Access denied: You are not assigned or associated with this ticket.');
  }

  if (!isAdmin) {
    const creatorId = ticket.createdBy?._id || ticket.createdBy;
    if (String(creatorId) !== String(currentUser._id)) {
      throw new Error('Access denied: This is not your ticket.');
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
    throw new Error('Only Super Admin can assign tickets.');
  }

  if (!isValidObjectId(id) || !isValidObjectId(consultantId)) {
    throw new Error('Invalid ticket ID or consultant ID.');
  }

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new Error('Ticket not found.');

  const targetConsultant = await ClientUser.findById(consultantId);
  if (!targetConsultant || !['consultant', 'clientuser', 'superadmin'].includes(targetConsultant.role)) {
    throw new Error('Target user is not a Consultant.');
  }

  const targetOnLeave = await checkConsultantOnLeave(consultantId);
  if (targetOnLeave) {
    throw new Error('Target consultant is currently on approved leave and cannot be assigned new tickets.');
  }

  ticket.assignedTo = targetConsultant._id;
  ticket.status = 'assigned';
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
    { path: 'assignmentHistory.forwardedTo', select: 'name email role' }
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
    throw new Error('Only Consultants or Super Admins can forward tickets.');
  }

  if (!isValidObjectId(id) || !isValidObjectId(consultantId)) {
    throw new Error('Invalid ticket ID or consultant ID.');
  }

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new Error('Ticket not found.');

  const isSuperAdmin = lowerRole === 'superadmin';
  const isAssignedConsultant = (lowerRole === 'consultant' || lowerRole === 'admin') && String(ticket.assignedTo) === String(currentUser._id);

  if (!isSuperAdmin && !isAssignedConsultant) {
    throw new Error('Only the currently assigned Consultant or a Super Admin can forward this ticket.');
  }

  const targetConsultant = await ClientUser.findById(consultantId);
  if (!targetConsultant || !['consultant', 'clientuser', 'superadmin'].includes(targetConsultant.role)) {
    throw new Error('Target user is not a Consultant.');
  }

  const targetOnLeave = await checkConsultantOnLeave(consultantId);
  if (targetOnLeave) {
    throw new Error('Target consultant is currently on approved leave and cannot be assigned new tickets.');
  }

  const previousAssignee = ticket.assignedTo;

  ticket.assignedTo = targetConsultant._id;
  ticket.status = 'assigned';
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
    { path: 'assignmentHistory.forwardedTo', select: 'name email role' }
  ]);

  let manualCCEmails = [];
  if (ccConsultantIds && ccConsultantIds.length > 0) {
    const consultants = await ClientUser.find({ _id: { $in: ccConsultantIds } }, 'email');
    manualCCEmails = consultants.map(c => c.email).filter(Boolean);
  }

  if (currentUser.role?.toLowerCase() === 'superadmin') {
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
    throw new Error('Invalid ticket ID');
  }

  const ticket = await Ticket.findById(ticketId).select('attachments createdBy assignedTo');
  if (!ticket) {
    throw new Error('Ticket not found');
  }

  if (currentUser.role === 'clientuser' && ticket.createdBy.toString() !== currentUser._id.toString()) {
    throw new Error('Access denied');
  }

  if ((currentUser.role === 'consultant' || currentUser.role === 'admin') && (!ticket.assignedTo || ticket.assignedTo.toString() !== currentUser._id.toString())) {
    throw new Error('Access denied: You are not assigned to this ticket.');
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
    throw new Error('Invalid ID format');
  }

  const ticket = await Ticket.findById(ticketId)
    .select('+attachments.data +supportingDocuments.data +adminAttachments.data +remarks.attachments.data');
  
  if (!ticket) {
    throw new Error('Ticket not found');
  }

  let attachment = ticket.attachments.id(attachmentId) || 
                     ticket.supportingDocuments?.id(attachmentId) || 
                     ticket.adminAttachments?.id(attachmentId);

  if (!attachment && ticket.remarks) {
    for (const remark of ticket.remarks) {
      if (remark.attachments) {
        const found = remark.attachments.id(attachmentId);
        if (found) { attachment = found; break; }
      }
    }
  }

  if (!attachment) {
    throw new Error('Attachment not found');
  }

  if (currentUser.role === 'clientuser' && ticket.createdBy.toString() !== currentUser._id.toString()) {
    throw new Error('Access denied');
  }

  if ((currentUser.role === 'consultant' || currentUser.role === 'admin') && (!ticket.assignedTo || ticket.assignedTo.toString() !== currentUser._id.toString())) {
    throw new Error('Access denied: You are not assigned to this ticket.');
  }

  return attachment;
};

export const addAttachmentsToTicket = async (currentUser, ticketId, filesList) => {
  if (!isValidObjectId(ticketId)) {
    throw new Error('Invalid ticket ID');
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }

  if (currentUser.role === 'clientuser' && ticket.createdBy.toString() !== currentUser._id.toString()) {
    throw new Error('Access denied');
  }

  if ((currentUser.role === 'consultant' || currentUser.role === 'admin') && (!ticket.assignedTo || ticket.assignedTo.toString() !== currentUser._id.toString())) {
    throw new Error('Access denied: You are not assigned to this ticket.');
  }

  if (!filesList?.length) {
    throw new Error('No files uploaded');
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
    throw new Error('Invalid ID format');
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }

  if (currentUser.role === 'clientuser' && ticket.createdBy.toString() !== currentUser._id.toString()) {
    throw new Error('Access denied');
  }

  if ((currentUser.role === 'consultant' || currentUser.role === 'admin') && (!ticket.assignedTo || ticket.assignedTo.toString() !== currentUser._id.toString())) {
    throw new Error('Access denied: You are not assigned to this ticket.');
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
    throw new Error('Attachment not found');
  }

  targetArray.pull(attachmentId);
  await ticket.save();
};
