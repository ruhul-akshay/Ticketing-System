import Client from '../models/Client.js';
import ClientUser from '../models/ClientUser.js';
import Ticket from '../models/Ticket.js';
import bcrypt from 'bcryptjs';
import { sendWelcomeCredentialsEmail } from '../utils/email.js';

/* ======================= HELPER: AUTO-CREATE CLIENT USER ======================= */
const generatePassword = (length = 12) => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const autoProvisionClientUser = async (client, contactEmail) => {
  if (!contactEmail) return;
  const email = contactEmail.toLowerCase().trim();

  // Check if a ClientUser with this email already exists
  const existingUser = await ClientUser.findOne({ email });
  if (existingUser) {
    // Just sync the client reference if needed
    if (!existingUser.client || existingUser.client.toString() !== client._id.toString()) {
      existingUser.client = client._id;
      existingUser.clientName = client.name;
      await existingUser.save();
    }
    return;
  }

  // Generate credentials
  const plainPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  const userName = client.contactPerson || client.name + ' Contact';

  const newUser = new ClientUser({
    email,
    password: hashedPassword,
    name: userName,
    client: client._id,
    clientName: client.name,
    role: 'clientuser',
    status: 'active',
    isFirstLogin: true,
    isPrimaryContact: true
  });

  await newUser.save();

  // Fire-and-forget welcome email
  sendWelcomeCredentialsEmail(email, userName, client.name, email, plainPassword, 'client_created')
    .catch(err => console.error('❌ WELCOME EMAIL FAILED:', err.message));

  console.log(`✅ AUTO-PROVISIONED CLIENT USER: ${email} for client ${client.name}`);
};

export const getClients = async (currentUser, { status, erpName, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 }) => {
  const query = {};

  if (currentUser.role === 'clientuser') {
    if (currentUser.client) {
      query._id = currentUser.client;
    } else if (currentUser.clientName) {
      query.name = currentUser.clientName;
    } else {
      return { clients: [], total: 0 };
    }
  }

  if (status && status !== 'all') query.status = status;
  if (erpName && erpName !== 'all') {
    if (erpName === 'none') {
      query.$or = [
        { 'erpDetails.erpName': { $exists: false } },
        { 'erpDetails.erpName': null },
        { 'erpDetails.erpName': '' }
      ];
    } else {
      query['erpDetails.erpName'] = erpName;
    }
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { domain: { $regex: search, $options: 'i' } },
      { contactPerson: { $regex: search, $options: 'i' } },
      { contactEmail: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  const clients = await Client.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('statusChangedBy', 'name email');

  // Self-healing: calculate actual counts dynamically and update DB
  for (const client of clients) {
    try {
      const clientUsers = await ClientUser.find({
        role: { $ne: 'superadmin' },
        $or: [
          { client: client._id },
          { clientName: { $regex: new RegExp(`^${client.name}$`, 'i') } }
        ]
      }).select('_id');

      const userIds = clientUsers.map(u => u._id);

      const tickets = await Ticket.find({
        createdBy: { $in: userIds }
      });

      const resolvedTickets = tickets.filter(t => ['resolved', 'Resolved', 'closed', 'Closed'].includes(t.status));
      const pendingTickets = tickets.filter(t => ['pending', 'Pending', 'open', 'Open'].includes(t.status));

      client.employeeCount = userIds.length;
      client.totalTickets = tickets.length;
      client.resolvedTickets = resolvedTickets.length;
      client.pendingTickets = pendingTickets.length;
      
      await client.save();
    } catch (err) {
      console.error(`Error auto-syncing stats for client ${client.name}:`, err);
    }
  }
  
  const total = await Client.countDocuments(query);
  
  return {
    clients,
    total
  };
};

export const getMyClient = async (currentUser) => {
  let client = null;

  if (currentUser.client) {
    client = await Client.findById(currentUser.client);
  }

  if (!client && currentUser.clientName) {
    client = await Client.findOne({ 
      name: { $regex: new RegExp(`^${currentUser.clientName}$`, 'i') } 
    });
  }

  if (!client) {
    throw new Error('You are not assigned to any client or client details not found');
  }

  const userTickets = await Ticket.countDocuments({ createdBy: currentUser._id });

  return {
    client,
    userTickets
  };
};

export const getClientDetails = async (id) => {
  const client = await Client.findById(id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('statusChangedBy', 'name email');
  
  if (!client) {
    throw new Error('Client not found');
  }

  const employees = await ClientUser.find({
    role: { $ne: 'superadmin' },
    $or: [
      { client: client._id },
      { clientName: { $regex: new RegExp(`^${client.name}$`, 'i') } }
    ]
  }).select('-password -resetPasswordToken -resetPasswordExpires');

  const employeeIds = employees.map(e => e._id);

  const tickets = await Ticket.find({
    createdBy: { $in: employeeIds }
  })
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .populate('department', 'name')
    .sort({ createdAt: -1 });

  const isResolved = (status) => ['resolved', 'Resolved', 'closed', 'Closed'].includes(status);
  const isPending = (status) => ['pending', 'Pending', 'open', 'Open', 'assigned', 'Assigned'].includes(status);

  const stats = {
    totalEmployees: employees.length,
    totalTickets: tickets.length,
    resolvedTickets: tickets.filter(t => isResolved(t.status)).length,
    pendingTickets: tickets.filter(t => isPending(t.status)).length,
    highPriorityTickets: tickets.filter(t => ['high', 'High', 'critical', 'Critical'].includes(t.priority)).length,
    averageResolutionTime: client.averageSupportTime,
    averageRating: client.averageRating
  };

  return {
    client,
    employees,
    tickets,
    stats
  };
};

export const createClient = async (currentUser, data) => {
  const {
    name,
    domain,
    contactPerson,
    contactEmail,
    contactPhone,
    erpDetails = {}
  } = data;

  if (!name || !domain) {
    throw new Error('Client name and domain are required');
  }

  const existingClient = await Client.findOne({ 
    $or: [
      { domain: domain.toLowerCase() },
      { name: { $regex: new RegExp(`^${name}$`, 'i') } }
    ]
  });

  if (existingClient) {
    throw new Error('Client with this domain or name already exists');
  }

  if (erpDetails) {
    if (erpDetails.sapSupportAMC?.status === 'Active') {
      if (!erpDetails.sapSupportAMC.fromDate || !erpDetails.sapSupportAMC.toDate) {
        throw new Error('From Date and To Date are required for Active SAP Support AMC');
      }
      
      const fromDate = new Date(erpDetails.sapSupportAMC.fromDate);
      const toDate = new Date(erpDetails.sapSupportAMC.toDate);
      
      if (fromDate >= toDate) {
        throw new Error('From Date must be before To Date');
      }
      
      if (toDate < new Date()) {
        throw new Error('To Date cannot be in the past');
      }
    }
    
    if (erpDetails.erpName && !['SAP B1', 'CREST', 'SFA'].includes(erpDetails.erpName)) {
      throw new Error('Invalid ERP name. Must be one of: SAP B1, CREST, SFA');
    }
  }

  const client = new Client({
    name: name.trim(),
    domain: domain.toLowerCase().trim(),
    contactPerson: contactPerson?.trim(),
    contactEmail: contactEmail?.toLowerCase().trim(),
    contactPhone: contactPhone?.trim(),
    erpDetails: erpDetails || {},
    createdBy: currentUser._id,
    updatedBy: currentUser._id,
    status: 'active'
  });

  await client.save();

  // Auto-provision ClientUser from contact email (fire-and-forget)
  if (contactEmail) {
    autoProvisionClientUser(client, contactEmail)
      .catch(err => console.error('❌ AUTO-PROVISION FAILED:', err.message));
  }

  return client;
};

export const updateClientPut = async (currentUser, id, data) => {
  const {
    name,
    contactPerson,
    contactEmail,
    contactPhone,
    erpDetails,
    status,
    statusReason
  } = data;

  const client = await Client.findById(id);
  if (!client) {
    throw new Error('Client not found');
  }

  if (name !== undefined) client.name = name.trim();
  if (contactPerson !== undefined) client.contactPerson = contactPerson?.trim();
  if (contactEmail !== undefined) client.contactEmail = contactEmail?.toLowerCase().trim();
  if (contactPhone !== undefined) client.contactPhone = contactPhone?.trim();

  if (erpDetails !== undefined) {
    if (!erpDetails || Object.keys(erpDetails).length === 0) {
      client.erpDetails = {};
    } else {
      if (erpDetails.erpName !== undefined) {
        client.erpDetails.erpName = erpDetails.erpName || null;
      }
      if (erpDetails.sapB1VersionType !== undefined) {
        client.erpDetails.sapB1VersionType = erpDetails.sapB1VersionType || null;
      }
      if (erpDetails.sapB1VersionAndFP !== undefined) {
        client.erpDetails.sapB1VersionAndFP = erpDetails.sapB1VersionAndFP?.trim() || '';
      }
      if (erpDetails.sapLicenseAMC !== undefined) {
        client.erpDetails.sapLicenseAMC = erpDetails.sapLicenseAMC || null;
      }
      if (erpDetails.sapSupportAMCType !== undefined) {
        client.erpDetails.sapSupportAMCType = erpDetails.sapSupportAMCType || null;
      }
      if (erpDetails.sapSupportHourlyCap !== undefined) {
        client.erpDetails.sapSupportHourlyCap = Number(erpDetails.sapSupportHourlyCap) || 0;
      }
      if (erpDetails.erpIncidentTypes !== undefined) {
        client.erpDetails.erpIncidentTypes = erpDetails.erpIncidentTypes || [];
      }
      
      if (erpDetails.sapSupportAMC !== undefined) {
        if (!client.erpDetails.sapSupportAMC) client.erpDetails.sapSupportAMC = {};
        if (erpDetails.sapSupportAMC.status !== undefined) {
          client.erpDetails.sapSupportAMC.status = erpDetails.sapSupportAMC.status || null;
        }
        if (erpDetails.sapSupportAMC.fromDate !== undefined) {
          client.erpDetails.sapSupportAMC.fromDate = erpDetails.sapSupportAMC.fromDate || null;
        }
        if (erpDetails.sapSupportAMC.toDate !== undefined) {
          client.erpDetails.sapSupportAMC.toDate = erpDetails.sapSupportAMC.toDate || null;
        }
      }
    }
    
    if (client.erpDetails.sapSupportAMC?.status === 'Active') {
      if (!client.erpDetails.sapSupportAMC.fromDate || !client.erpDetails.sapSupportAMC.toDate) {
        throw new Error('From Date and To Date are required for Active SAP Support AMC');
      }
      
      const fromDate = new Date(client.erpDetails.sapSupportAMC.fromDate);
      const toDate = new Date(client.erpDetails.sapSupportAMC.toDate);
      
      if (fromDate >= toDate) {
        throw new Error('From Date must be before To Date');
      }
    }
  }

  if (status && status !== client.status) {
    client.status = status;
    client.statusReason = statusReason?.trim();
    client.statusChangedBy = currentUser._id;
    client.statusChangedAt = new Date();
  }

  client.updatedBy = currentUser._id;
  await client.save();

  // Auto-provision ClientUser from contact email if changed
  if (contactEmail !== undefined && client.contactEmail) {
    autoProvisionClientUser(client, client.contactEmail)
      .catch(err => console.error('❌ AUTO-PROVISION FAILED:', err.message));
  }

  return client;
};

export const updateClientPatch = async (currentUser, id, data) => {
  const {
    name,
    contactPerson,
    contactEmail,
    contactPhone,
    erpDetails,
    status,
    statusReason
  } = data;

  const client = await Client.findById(id);
  if (!client) {
    throw new Error('Client not found');
  }

  if (name !== undefined && name !== null) client.name = name.trim();
  if (contactPerson !== undefined && contactPerson !== null) client.contactPerson = contactPerson.trim();
  if (contactEmail !== undefined && contactEmail !== null) client.contactEmail = contactEmail.toLowerCase().trim();
  if (contactPhone !== undefined && contactPhone !== null) client.contactPhone = contactPhone.trim();

  if (erpDetails !== undefined && erpDetails !== null) {
    if (!client.erpDetails) client.erpDetails = {};
    
    if (erpDetails.erpName !== undefined) {
      client.erpDetails.erpName = erpDetails.erpName || null;
    }
    if (erpDetails.sapB1VersionType !== undefined) {
      client.erpDetails.sapB1VersionType = erpDetails.sapB1VersionType || null;
    }
    if (erpDetails.sapB1VersionAndFP !== undefined) {
      client.erpDetails.sapB1VersionAndFP = erpDetails.sapB1VersionAndFP?.trim() || '';
    }
    if (erpDetails.sapLicenseAMC !== undefined) {
      client.erpDetails.sapLicenseAMC = erpDetails.sapLicenseAMC || null;
    }
    if (erpDetails.sapSupportAMCType !== undefined) {
      client.erpDetails.sapSupportAMCType = erpDetails.sapSupportAMCType || null;
    }
    if (erpDetails.sapSupportHourlyCap !== undefined) {
      client.erpDetails.sapSupportHourlyCap = Number(erpDetails.sapSupportHourlyCap) || 0;
    }
    if (erpDetails.erpIncidentTypes !== undefined) {
      client.erpDetails.erpIncidentTypes = erpDetails.erpIncidentTypes || [];
    }
    
    if (erpDetails.sapSupportAMC !== undefined) {
      if (!client.erpDetails.sapSupportAMC) client.erpDetails.sapSupportAMC = {};
      if (erpDetails.sapSupportAMC.status !== undefined) {
        client.erpDetails.sapSupportAMC.status = erpDetails.sapSupportAMC.status || null;
      }
      if (erpDetails.sapSupportAMC.fromDate !== undefined) {
        client.erpDetails.sapSupportAMC.fromDate = erpDetails.sapSupportAMC.fromDate || null;
      }
      if (erpDetails.sapSupportAMC.toDate !== undefined) {
        client.erpDetails.sapSupportAMC.toDate = erpDetails.sapSupportAMC.toDate || null;
      }
      
      if (client.erpDetails.sapSupportAMC?.status === 'Active') {
        if (!client.erpDetails.sapSupportAMC.fromDate || !client.erpDetails.sapSupportAMC.toDate) {
          throw new Error('From Date and To Date are required for Active SAP Support AMC');
        }
        
        const fromDate = new Date(client.erpDetails.sapSupportAMC.fromDate);
        const toDate = new Date(client.erpDetails.sapSupportAMC.toDate);
        
        if (fromDate >= toDate) {
          throw new Error('From Date must be before To Date');
        }
      }
    }
  }

  if (status !== undefined && status !== null && status !== client.status) {
    client.status = status;
    client.statusReason = statusReason?.trim();
    client.statusChangedBy = currentUser._id;
    client.statusChangedAt = new Date();
  }

  client.updatedBy = currentUser._id;
  await client.save();

  // Auto-provision ClientUser from contact email if changed
  if (contactEmail !== undefined && client.contactEmail) {
    autoProvisionClientUser(client, client.contactEmail)
      .catch(err => console.error('❌ AUTO-PROVISION FAILED:', err.message));
  }

  return client;
};

export const deleteClient = async (id) => {
  const client = await Client.findById(id);
  if (!client) {
    throw new Error('Client not found');
  }

  const employeeCount = await ClientUser.countDocuments({
    clientName: client.name
  });

  if (employeeCount > 0) {
    throw new Error('Cannot delete client with existing employees. Please reassign or delete employees first.');
  }

  const ticketsCount = await Ticket.countDocuments({
    'createdBy.clientName': client.name
  });

  if (ticketsCount > 0) {
    throw new Error('Cannot delete client with existing tickets. Please resolve or reassign tickets first.');
  }

  await Client.findByIdAndDelete(id);
};

export const refreshClientAnalytics = async (currentUser) => {
  const allClients = await Client.find({});
  const clients = [];
  const errors = [];
  
  for (const client of allClients) {
    try {
      const clientUsers = await ClientUser.find({
        role: { $ne: 'superadmin' },
        $or: [
          { client: client._id },
          { clientName: { $regex: new RegExp(`^${client.name}$`, 'i') } }
        ]
      }).select('_id');
      
      const userIds = clientUsers.map(u => u._id);
      
      const tickets = await Ticket.find({
        createdBy: { $in: userIds }
      });

      const resolvedTickets = tickets.filter(t => ['resolved', 'Resolved', 'closed', 'Closed'].includes(t.status));
      const pendingTickets = tickets.filter(t => ['pending', 'Pending', 'open', 'Open'].includes(t.status));
      
      const solvedWithTime = tickets.filter(t => t.timeToSolve && t.timeToSolve > 0);

      const totalSupportTime = solvedWithTime.reduce(
        (sum, t) => sum + (t.timeToSolve || 0),
        0
      );

      const averageSupportTime = solvedWithTime.length > 0
        ? totalSupportTime / solvedWithTime.length
        : 0;

      const ratedTickets = tickets.filter(t => t.feedback?.rating);
      const averageRating = ratedTickets.length > 0
        ? ratedTickets.reduce((sum, t) => sum + t.feedback.rating, 0) / ratedTickets.length
        : 0;

      client.employeeCount = userIds.length;
      client.totalTickets = tickets.length;
      client.resolvedTickets = resolvedTickets.length;
      client.pendingTickets = pendingTickets.length;
      client.totalSupportTime = totalSupportTime;
      client.averageSupportTime = averageSupportTime;
      client.averageRating = averageRating;
      client.totalFeedbacks = ratedTickets.length;
      client.updatedBy = currentUser._id;

      await client.save();
      clients.push(client);
    } catch (error) {
      console.error(`Error for client ${client.name}:`, error);
      errors.push({ clientName: client.name, error: error.message });
    }
  }

  return {
    clientsCount: clients.length,
    errors
  };
};

export const getClientStatsOverview = async () => {
  const allClients = await Client.find({});
  for (const client of allClients) {
    try {
      const clientUsers = await ClientUser.find({
        role: { $ne: 'superadmin' },
        $or: [
          { client: client._id },
          { clientName: { $regex: new RegExp(`^${client.name}$`, 'i') } }
        ]
      }).select('_id');

      const userIds = clientUsers.map(u => u._id);

      const tickets = await Ticket.find({
        createdBy: { $in: userIds }
      });

      const resolvedTickets = tickets.filter(t => ['resolved', 'Resolved', 'closed', 'Closed'].includes(t.status));
      const pendingTickets = tickets.filter(t => ['pending', 'Pending', 'open', 'Open'].includes(t.status));

      client.employeeCount = userIds.length;
      client.totalTickets = tickets.length;
      client.resolvedTickets = resolvedTickets.length;
      client.pendingTickets = pendingTickets.length;
      
      await client.save();
    } catch (err) {
      console.error(`Error auto-syncing stats for client ${client.name} in overview:`, err);
    }
  }
  
  const totalClients = await Client.countDocuments();
  const activeClients = await Client.countDocuments({ status: 'active' });
  const suspendedClients = await Client.countDocuments({ status: 'suspended' });
  const frozenClients = await Client.countDocuments({ status: 'frozen' });

  const erpStats = await Client.aggregate([
    {
      $group: {
        _id: '$erpDetails.erpName',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const now = new Date();
  const clientsWithExpiredAMC = await Client.countDocuments({
    'erpDetails.sapSupportAMC.status': 'Active',
    'erpDetails.sapSupportAMC.toDate': { $lt: now }
  });

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const clientsWithAMCExpiringSoon = await Client.countDocuments({
    'erpDetails.sapSupportAMC.status': 'Active',
    'erpDetails.sapSupportAMC.toDate': { 
      $gte: now,
      $lte: thirtyDaysFromNow
    }
  });

  const avgStats = await Client.aggregate([
    {
      $group: {
        _id: null,
        avgEmployees: { $avg: '$employeeCount' },
        avgTickets: { $avg: '$totalTickets' },
        avgResolutionRate: { 
          $avg: { 
            $cond: [
              { $eq: ['$totalTickets', 0] },
              0,
              { $divide: ['$resolvedTickets', '$totalTickets'] }
            ]
          }
        },
        avgSupportTime: { $avg: '$averageSupportTime' },
        avgRating: { $avg: '$averageRating' }
      }
    }
  ]);

  const topClientsByEmployees = await Client.find()
    .sort({ employeeCount: -1 })
    .limit(5)
    .select('name employeeCount totalTickets averageRating');

  const topClientsByTickets = await Client.find()
    .sort({ totalTickets: -1 })
    .limit(5)
    .select('name totalTickets resolvedTickets pendingTickets');

  const stats = avgStats[0] || {};

  return {
    totalClients,
    statusDistribution: {
      active: activeClients,
      suspended: suspendedClients,
      frozen: frozenClients
    },
    erpDistribution: erpStats.reduce((acc, stat) => {
      const key = stat._id === null ? 'Unknown' : stat._id;
      acc[key] = stat.count;
      return acc;
    }, {}),
    amcStatus: {
      expired: clientsWithExpiredAMC,
      expiringSoon: clientsWithAMCExpiringSoon
    },
    averages: {
      employees: Math.round(stats.avgEmployees || 0),
      tickets: Math.round(stats.avgTickets || 0),
      resolutionRate: Math.round((stats.avgResolutionRate || 0) * 100),
      supportTime: Math.round(stats.avgSupportTime || 0),
      rating: (stats.avgRating || 0).toFixed(1)
    },
    topClients: {
      byEmployees: topClientsByEmployees,
      byTickets: topClientsByTickets
    }
  };
};

export const getERPSystemTypes = async () => {
  const erpTypes = await Client.distinct('erpDetails.erpName');
  
  const filteredTypes = erpTypes
    .filter(type => type)
    .sort();
  
  const erpCounts = await Promise.all(
    filteredTypes.map(async (type) => {
      const count = await Client.countDocuments({ 'erpDetails.erpName': type });
      return { name: type, count };
    })
  );
  
  const noERPCount = await Client.countDocuments({
    $or: [
      { 'erpDetails.erpName': { $exists: false } },
      { 'erpDetails.erpName': null },
      { 'erpDetails.erpName': '' }
    ]
  });
  
  if (noERPCount > 0) {
    erpCounts.push({ name: 'No ERP', count: noERPCount });
  }
  
  return {
    erpCounts,
    totalTypes: erpCounts.length
  };
};

export const searchClientNames = async (query) => {
  const searchQuery = query ? {
    name: { $regex: query, $options: 'i' }
  } : {};
  
  return await Client.find(searchQuery)
    .select('name domain')
    .limit(10)
    .sort({ name: 1 });
};

export const bulkUpdateClientStatus = async (currentUser, { clientIds, status, statusReason }) => {
  if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
    throw new Error('Client IDs are required');
  }
  
  if (!status || !['active', 'suspended', 'frozen'].includes(status)) {
    throw new Error('Valid status is required');
  }
  
  const result = await Client.updateMany(
    { _id: { $in: clientIds } },
    {
      $set: {
        status,
        statusReason,
        statusChangedBy: currentUser._id,
        statusChangedAt: new Date(),
        updatedBy: currentUser._id,
        updatedAt: new Date()
      }
    }
  );
  
  return result.modifiedCount;
};

export const exportClientsCSV = async () => {
  const clients = await Client.find()
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
  
  const headers = [
    'ID', 'Name', 'Domain', 'Contact Person', 'Contact Email', 'Contact Phone',
    'ERP Name', 'SAP B1 Version Type', 'SAP Version & FP', 'SAP License AMC',
    'SAP Support AMC Status', 'SAP Support AMC From Date', 'SAP Support AMC To Date',
    'SAP Support AMC Type', 'ERP Incident Types', 'Employee Count', 'Total Tickets',
    'Resolved Tickets', 'Pending Tickets', 'Total Support Time', 'Average Support Time',
    'Average Rating', 'Total Feedbacks', 'Status', 'Status Reason', 'Created At',
    'Updated At', 'Created By', 'Updated By'
  ];
  
  const rows = clients.map(client => [
    client._id,
    `"${client.name}"`,
    client.domain,
    `"${client.contactPerson || ''}"`,
    client.contactEmail || '',
    client.contactPhone || '',
    client.erpDetails?.erpName || '',
    client.erpDetails?.sapB1VersionType || '',
    `"${client.erpDetails?.sapB1VersionAndFP || ''}"`,
    client.erpDetails?.sapLicenseAMC || '',
    client.erpDetails?.sapSupportAMC?.status || '',
    client.erpDetails?.sapSupportAMC?.fromDate ? 
      new Date(client.erpDetails.sapSupportAMC.fromDate).toISOString().split('T')[0] : '',
    client.erpDetails?.sapSupportAMC?.toDate ? 
      new Date(client.erpDetails.sapSupportAMC.toDate).toISOString().split('T')[0] : '',
    client.erpDetails?.sapSupportAMCType || '',
    `"${(client.erpDetails?.erpIncidentTypes || []).join(', ')}"`,
    client.employeeCount,
    client.totalTickets,
    client.resolvedTickets,
    client.pendingTickets,
    client.totalSupportTime,
    client.averageSupportTime,
    client.averageRating,
    client.totalFeedbacks,
    client.status,
    `"${client.statusReason || ''}"`,
    client.createdAt.toISOString(),
    client.updatedAt.toISOString(),
    client.createdBy ? `"${client.createdBy.name} <${client.createdBy.email}>"` : '',
    client.updatedBy ? `"${client.updatedBy.name} <${client.updatedBy.email}>"` : ''
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

export const renewClientSupportContract = async (currentUser, id, { fromDate, toDate, sapSupportHourlyCap, sapSupportAMCType }) => {
  const client = await Client.findById(id);
  if (!client) {
    throw new Error('Client not found');
  }

  if (!client.erpDetails) client.erpDetails = {};
  if (!client.erpDetails.sapSupportAMC) client.erpDetails.sapSupportAMC = {};

  client.erpDetails.sapSupportAMC.status = 'Active';
  client.erpDetails.sapSupportAMC.fromDate = fromDate ? new Date(fromDate) : client.erpDetails.sapSupportAMC.fromDate;
  client.erpDetails.sapSupportAMC.toDate = toDate ? new Date(toDate) : client.erpDetails.sapSupportAMC.toDate;
  
  if (sapSupportAMCType !== undefined) {
    client.erpDetails.sapSupportAMCType = sapSupportAMCType;
  }
  
  if (sapSupportHourlyCap !== undefined) {
    client.erpDetails.sapSupportHourlyCap = Number(sapSupportHourlyCap) || 0;
  }

  client.totalSupportTime = 0;
  if (client.erpDetails) {
    client.erpDetails.hoursUsed = 0;
  }
  client.updatedBy = currentUser._id;

  await client.save();
  return client;
};
