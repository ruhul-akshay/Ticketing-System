import ClientUser from '../models/ClientUser.js';
import Client from '../models/Client.js';
import Department from '../models/Department.js';
import Ticket from '../models/Ticket.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { sendWelcomeCredentialsEmail } from '../utils/email.js';

export const getAllUsers = async (currentUser, { status, role, clientId, search, page = 1, limit = 1000, roleType = 'all' }) => {
  const query = {};
  
  if (status && status !== 'all') query.status = status;
  if (role && role !== 'all') query.role = role;
  if (clientId && clientId !== 'all') query.client = clientId;
  
  if (roleType === 'consultant') {
    query.role = 'consultant';
  } else if (roleType === 'clientuser') {
    query.role = 'clientuser';
  } else if (role && role !== 'all') {
    query.role = role;
  }
  
  if (currentUser.role === 'clientuser') {
    query.client = currentUser.client;
    query.role = 'clientuser';
  } else if (currentUser.role === 'consultant' && currentUser.client) {
    query.client = currentUser.client;
  }
  
  if (currentUser.role === 'consultant') {
    query.role = { $ne: 'superadmin' };
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeCode: { $regex: search, $options: 'i' } },
      { clientName: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (page - 1) * limit;
  
  const users = await ClientUser.find(query)
    .select('-password -resetPasswordToken -resetPasswordExpires')
    .populate('client', 'name domain')
    .populate('department', 'name')
    .populate('statusChangedBy', 'name email')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await ClientUser.countDocuments(query);
  
  const baseQuery = roleType !== 'all' ? { role: roleType } : {};
  if (currentUser.role === 'clientuser') {
    baseQuery.client = currentUser.client;
    baseQuery.role = 'clientuser';
  } else if (currentUser.role === 'consultant' && currentUser.client) {
    baseQuery.client = currentUser.client;
    baseQuery.role = { $ne: 'superadmin' };
  }
  
  const stats = {
    totalClientUsers: await ClientUser.countDocuments({ ...baseQuery }),
    activeClientUsers: await ClientUser.countDocuments({ ...baseQuery, status: 'active' }),
    suspendedClientUsers: await ClientUser.countDocuments({ ...baseQuery, status: 'suspended' }),
    frozenClientUsers: await ClientUser.countDocuments({ ...baseQuery, status: 'frozen' }),
    clientuserRole: await ClientUser.countDocuments({ 
      ...((currentUser.role === 'consultant' || currentUser.role === 'clientuser') && currentUser.client ? { client: currentUser.client } : {}),
      role: 'clientuser' 
    }),
    consultantRole: await ClientUser.countDocuments({ 
      ...((currentUser.role === 'consultant' || currentUser.role === 'clientuser') && currentUser.client ? { client: currentUser.client } : {}),
      role: 'consultant' 
    }),
    ...(currentUser.role === 'superadmin' ? {
      superadminRole: await ClientUser.countDocuments({ role: 'superadmin' })
    } : {})
  };
  
  let clients = [];
  if (currentUser.role === 'superadmin') {
    clients = await Client.find().select('name').sort({ name: 1 });
  } else if (currentUser.role === 'consultant' && currentUser.client) {
    const client = await Client.findById(currentUser.client).select('name');
    if (client) clients = [client];
  }
  
  return {
    users,
    stats,
    clients: clients.map(c => ({ id: c._id, name: c.name })),
    total
  };
};

export const getUsersByRole = async (currentUser, targetRole, { status, search, page = 1, limit = 1000 }) => {
  if (!['clientuser', 'consultant', 'superadmin'].includes(targetRole)) {
    throw new Error('Invalid role specified');
  }
  
  if (currentUser.role === 'clientuser') {
    if (targetRole !== 'clientuser') {
      throw new Error('Access denied to this role');
    }
  }
  
  if (currentUser.role === 'consultant' && targetRole === 'superadmin') {
    throw new Error('Access denied to superadmin data');
  }
  
  const query = { role: targetRole };
  
  if (targetRole === 'clientuser' && currentUser.client) {
    query.client = currentUser.client;
  }
  
  if (status && status !== 'all') query.status = status;
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeCode: { $regex: search, $options: 'i' } },
      { clientName: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (page - 1) * limit;
  
  const users = await ClientUser.find(query)
    .select('-password -resetPasswordToken -resetPasswordExpires')
    .populate('client', 'name domain')
    .populate('department', 'name')
    .populate('statusChangedBy', 'name email')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await ClientUser.countDocuments(query);
  
  const stats = {
    total: await ClientUser.countDocuments(query),
    active: await ClientUser.countDocuments({ ...query, status: 'active' }),
    suspended: await ClientUser.countDocuments({ ...query, status: 'suspended' }),
    frozen: await ClientUser.countDocuments({ ...query, status: 'frozen' }),
    withClient: await ClientUser.countDocuments({ ...query, client: { $exists: true, $ne: null } }),
    withDepartment: await ClientUser.countDocuments({ ...query, department: { $exists: true, $ne: null } })
  };
  
  return {
    users,
    stats,
    total
  };
};

export const getUserById = async (currentUser, id) => {
  const isSelf = id === currentUser._id.toString();
  
  if (!isSelf && !['superadmin', 'consultant', 'clientuser'].includes(currentUser.role)) {
    throw new Error('Access Denied');
  }
  
  const user = await ClientUser.findById(id)
    .select('-password -resetPasswordToken -resetPasswordExpires')
    .populate('client', 'name domain')
    .populate('department', 'name')
    .populate('statusChangedBy', 'name email')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
  
  if (!user) {
    throw new Error('Client ClientUser not found');
  }
  
  if (currentUser.role === 'consultant' && !isSelf) {
    if (user.client?._id?.toString() !== currentUser.client?.toString()) {
      throw new Error('Access denied to users from other clients');
    }
    if (user.role === 'superadmin') {
      throw new Error('Access denied to superadmin data');
    }
  }
  
  if (currentUser.role === 'clientuser' && !isSelf) {
    if (user.client?._id?.toString() !== currentUser.client?.toString()) {
      throw new Error('Access denied to users from other clients');
    }
    if (user.role !== 'clientuser') {
      throw new Error('Access denied to this user');
    }
  }
  
  return user;
};

export const createUser = async (currentUser, data) => {
  const {
    email,
    password,
    name,
    employeeCode,
    clientId,
    clientName,
    departmentId,
    phoneNumber,
    position,
    role = 'clientuser'
  } = data;
  
  if (!email || !password || !name) {
    throw new Error('Email, password, and name are required');
  }
  
  let allowedRoles = [];
  if (currentUser.role === 'superadmin') {
    allowedRoles = ['clientuser', 'consultant', 'superadmin'];
  } else if (currentUser.role === 'consultant') {
    allowedRoles = ['clientuser', 'consultant'];
  } else if (currentUser.role === 'clientuser') {
    allowedRoles = ['clientuser'];
  }
  
  if (!allowedRoles.includes(role)) {
    throw new Error(`Invalid role. Must be ${allowedRoles.join(' or ')}`);
  }
  
  const existingUser = await ClientUser.findOne({ 
    $or: [
      { email: email.toLowerCase() },
      ...(employeeCode ? [{ employeeCode }] : [])
    ]
  });
  
  if (existingUser) {
    throw new Error('Client ClientUser with this email or employee code already exists');
  }
  
  let finalClientId = clientId;
  let finalClientName = clientName;
  
  if (currentUser.role === 'clientuser') {
    if (!currentUser.isPrimaryContact) {
      throw new Error('Only the primary client account can manage the team');
    }
  }
  
  if (currentUser.role === 'consultant' || currentUser.role === 'clientuser') {
    if (clientId && clientId !== currentUser.client?.toString()) {
      throw new Error('You can only create users for your own client');
    }
    finalClientId = currentUser.client;
    if (currentUser.client) {
      const client = await Client.findById(currentUser.client);
      if (client) {
        finalClientName = client.name;
      }
    }
  } else if (clientId) {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    finalClientName = client.name;
  }
  
  if (departmentId) {
    const department = await Department.findById(departmentId);
    if (!department) {
      throw new Error('Department not found');
    }
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = new ClientUser({
    email: email.toLowerCase(),
    password: hashedPassword,
    name,
    employeeCode,
    client: finalClientId || null,
    clientName: finalClientName,
    department: departmentId || null,
    phoneNumber,
    position,
    role: role === 'superadmin' && currentUser.role !== 'superadmin' ? 'consultant' : role,
    status: 'active',
    createdBy: currentUser._id,
    updatedBy: currentUser._id
  });
  
  await user.save();

  // Send welcome credentials email to manually created user
  sendWelcomeCredentialsEmail(user.email, user.name, user.clientName || '', user.email, password, 'client_user_created')
    .catch(err => console.error('❌ MANUAL CLIENT USER WELCOME EMAIL FAILED:', err.message));
  
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.resetPasswordToken;
  delete userResponse.resetPasswordExpires;
  
  return userResponse;
};

export const updateUser = async (currentUser, id, data) => {
  const {
    name,
    email,
    employeeCode,
    clientId,
    clientName,
    departmentId,
    phoneNumber,
    position,
    role,
    preferences,
    leaveFrom,
    leaveTo,
    hourlyCost,
    status,
    statusReason
  } = data;
  
  const user = await ClientUser.findById(id);
  if (!user) {
    throw new Error('Client ClientUser not found');
  }
  
  const isSelf = id === currentUser._id.toString();
  const isAuthorized = ['superadmin', 'consultant', 'clientuser'].includes(currentUser.role);
  
  if (!isSelf && !isAuthorized) {
    throw new Error('Access Denied');
  }
  
  if (currentUser.role === 'consultant' && !isSelf) {
    if (user.client?._id?.toString() !== currentUser.client?.toString()) {
      throw new Error('You can only update users from your own client');
    }
    if (user.role === 'superadmin') {
      throw new Error('You cannot update superadmin users');
    }
  }
  
  if (currentUser.role === 'clientuser' && !isSelf) {
    if (!currentUser.isPrimaryContact) {
      throw new Error('Only the primary client account can manage the team');
    }
    if (user.client?._id?.toString() !== currentUser.client?.toString()) {
      throw new Error('You can only update users from your own client');
    }
    if (user.role !== 'clientuser') {
      throw new Error('You can only update client users');
    }
  }
  
  if (isSelf) {
    if (role && role !== user.role) {
      throw new Error('You cannot change your own role');
    }
    if (data.status && data.status !== user.status) {
      throw new Error('You cannot change your own status');
    }
  }
  
  if (role) {
    let allowedRoles = [];
    if (currentUser.role === 'superadmin') {
      allowedRoles = ['clientuser', 'consultant', 'superadmin'];
    } else if (currentUser.role === 'consultant') {
      allowedRoles = ['clientuser', 'consultant'];
    } else if (currentUser.role === 'clientuser') {
      allowedRoles = ['clientuser'];
    }
    
    if (!allowedRoles.includes(role)) {
      throw new Error(`Invalid role. Must be ${allowedRoles.join(' or ')}`);
    }
    
    if (currentUser.role === 'consultant' && role === 'superadmin') {
      throw new Error('You cannot set role to superadmin');
    }
  }
  
  if (email && email.toLowerCase() !== user.email) {
    const existingWithEmail = await ClientUser.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: id }
    });
    if (existingWithEmail) {
      throw new Error('Email address already in use');
    }
    user.email = email.toLowerCase();
  }

  if (employeeCode && employeeCode !== user.employeeCode) {
    const existingWithCode = await ClientUser.findOne({ 
      employeeCode,
      _id: { $ne: id }
    });
    if (existingWithCode) {
      throw new Error('Employee code already in use');
    }
  }
  
  let finalClientId = clientId;
  let finalClientName = clientName;
  
  if (clientId && clientId !== user.client?.toString()) {
    if ((currentUser.role === 'consultant' || currentUser.role === 'clientuser') && clientId !== currentUser.client?.toString()) {
      throw new Error('You can only assign users to your own client');
    }
    
    const client = await Client.findById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    finalClientName = client.name;
  }
  
  if (departmentId) {
    const department = await Department.findById(departmentId);
    if (!department) {
      throw new Error('Department not found');
    }
  }
  
  if (name !== undefined) user.name = name;
  if (employeeCode !== undefined) user.employeeCode = employeeCode || null;
  if (clientId !== undefined) user.client = finalClientId || null;
  if (clientName !== undefined || clientId !== undefined) {
    user.clientName = finalClientName || user.clientName;
  }
  if (departmentId !== undefined) user.department = departmentId || null;
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
  if (position !== undefined) user.position = position;
  if (role !== undefined) user.role = role;
  if (leaveFrom !== undefined) user.leaveFrom = leaveFrom ? new Date(leaveFrom) : null;
  if (leaveTo !== undefined) user.leaveTo = leaveTo ? new Date(leaveTo) : null;
  if (hourlyCost !== undefined) user.hourlyCost = Number(hourlyCost) || 0;
  if (preferences !== undefined) {
    user.preferences = { ...user.preferences, ...preferences };
  }
  if (data.password) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    user.password = hashedPassword;
  }
  
  if (status !== undefined) {
    let targetStatus = status.toLowerCase();
    if (targetStatus === 'inactive') targetStatus = 'suspended';
    
    if (targetStatus !== user.status) {
      if (isSelf) {
        throw new Error('You cannot change your own status');
      }
      if (!['active', 'suspended', 'frozen'].includes(targetStatus)) {
        throw new Error('Invalid status. Must be active, suspended, or frozen');
      }
      user.status = targetStatus;
      user.statusReason = statusReason || 'Updated via Profile';
      user.statusChangedBy = currentUser._id;
      user.statusChangedAt = new Date();
    }
  }
  
  user.updatedBy = currentUser._id;
  await user.save();
  
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.resetPasswordToken;
  delete userResponse.resetPasswordExpires;
  
  return userResponse;
};

export const updateUserStatus = async (currentUser, id, { status, statusReason }) => {
  let targetStatus = status ? status.toLowerCase() : '';
  if (targetStatus === 'inactive') {
    targetStatus = 'suspended';
  }

  if (!['active', 'suspended', 'frozen'].includes(targetStatus)) {
    throw new Error('Invalid status. Must be active, suspended, or frozen');
  }
  
  if (id === currentUser._id.toString()) {
    throw new Error('You cannot change your own status');
  }
  
  const user = await ClientUser.findById(id);
  if (!user) {
    throw new Error('Client ClientUser not found');
  }
  
  if (currentUser.role === 'consultant') {
    if (user.client?._id?.toString() !== currentUser.client?.toString()) {
      throw new Error('You can only update users from your own client');
    }
    if (user.role === 'superadmin') {
      throw new Error('You cannot update superadmin users');
    }
    if (user.role === 'consultant') {
      throw new Error('Only superadmin can update consultant status');
    }
  }
  
  if (currentUser.role === 'clientuser') {
    if (!currentUser.isPrimaryContact) {
      throw new Error('Only the primary client account can manage the team');
    }
    if (user.client?._id?.toString() !== currentUser.client?.toString()) {
      throw new Error('You can only update users from your own client');
    }
    if (user.role !== 'clientuser') {
      throw new Error('You can only update status for client users');
    }
  }
  
  user.status = targetStatus;
  user.statusReason = statusReason || '';
  user.statusChangedBy = currentUser._id;
  user.statusChangedAt = new Date();
  user.updatedBy = currentUser._id;
  
  await user.save();
  
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    status: user.status,
    statusReason: user.statusReason,
    statusChangedAt: user.statusChangedAt
  };
};

export const resetUserPassword = async (currentUser, id, newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters');
  }
  
  const user = await ClientUser.findById(id);
  if (!user) {
    throw new Error('Client ClientUser not found');
  }
  
  if (currentUser.role === 'consultant') {
    if (user.client?._id?.toString() !== currentUser.client?.toString()) {
      throw new Error('You can only reset passwords for users in your client');
    }
    if (user.role === 'superadmin') {
      throw new Error('You cannot reset superadmin passwords');
    }
  }
  
  if (currentUser.role === 'clientuser') {
    if (!currentUser.isPrimaryContact) {
      throw new Error('Only the primary client account can manage the team');
    }
    if (user.client?._id?.toString() !== currentUser.client?.toString()) {
      throw new Error('You can only reset passwords for users in your client');
    }
    if (user.role !== 'clientuser') {
      throw new Error('You can only reset passwords for client users');
    }
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.updatedBy = currentUser._id;
  
  await user.save();
};

export const updateOwnPassword = async (currentUser, { currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    throw new Error('Current password and new password are required');
  }
  
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters');
  }
  
  const user = await ClientUser.findById(currentUser._id);
  
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.updatedBy = currentUser._id;
  
  await user.save();
};

export const deleteUser = async (currentUser, id) => {
  if (id === currentUser._id.toString()) {
    throw new Error('You cannot delete your own account');
  }
  
  const user = await ClientUser.findById(id);
  if (!user) {
    throw new Error('Client ClientUser not found');
  }
  
  if (user.role === 'superadmin' && currentUser._id.toString() !== user._id.toString()) {
    throw new Error('Cannot delete other superadmin accounts');
  }
  
  if (currentUser.role === 'clientuser') {
    if (!currentUser.isPrimaryContact) {
      throw new Error('Only the primary client account can manage the team');
    }
    if (user.client?._id?.toString() !== currentUser.client?.toString()) {
      throw new Error('You can only delete users from your own client');
    }
    if (user.role !== 'clientuser') {
      throw new Error('You can only delete client users');
    }
  }
  
  const ticketCount = await Ticket.countDocuments({ createdBy: user._id });
  if (ticketCount > 0) {
    throw new Error('Cannot delete user with existing tickets. Please reassign tickets first.');
  }
  
  await ClientUser.findByIdAndDelete(id);
};

export const getUserStatsOverview = async (currentUser) => {
  let baseQuery = {};
  if (currentUser.role === 'clientuser') {
    baseQuery.client = currentUser.client;
    baseQuery.role = 'clientuser';
  } else if (currentUser.role === 'consultant' && currentUser.client) {
    baseQuery.client = currentUser.client;
    baseQuery.role = { $ne: 'superadmin' };
  }
  
  const totalUsers = await ClientUser.countDocuments(baseQuery);
  const activeUsers = await ClientUser.countDocuments({ ...baseQuery, status: 'active' });
  const suspendedUsers = await ClientUser.countDocuments({ ...baseQuery, status: 'suspended' }),
        frozenUsers = await ClientUser.countDocuments({ ...baseQuery, status: 'frozen' });
  
  const userRole = await ClientUser.countDocuments({ ...baseQuery, role: 'clientuser' });
  const consultantRole = await ClientUser.countDocuments({ ...baseQuery, role: 'consultant' });
  let superadminRole = 0;
  if (currentUser.role === 'superadmin') {
    superadminRole = await ClientUser.countDocuments({ role: 'superadmin' });
  }
  
  const usersWithClient = await ClientUser.countDocuments({ 
    ...baseQuery,
    client: { $exists: true, $ne: null } 
  });
  
  const usersWithDepartment = await ClientUser.countDocuments({ 
    ...baseQuery,
    department: { $exists: true, $ne: null } 
  });
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentRegistrations = await ClientUser.countDocuments({ 
    ...baseQuery,
    createdAt: { $gte: sevenDaysAgo } 
  });
  
  const usersWithLastLogin = await ClientUser.countDocuments({ 
    ...baseQuery,
    lastLogin: { $exists: true, $ne: null } 
  });
  
  let avgUsersPerClient = 0;
  if (currentUser.role === 'superadmin') {
    const result = await ClientUser.aggregate([
      {
        $match: { client: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: '$client',
          userCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          avgUsers: { $avg: '$userCount' }
        }
      }
    ]);
    
    avgUsersPerClient = result[0]?.avgUsers || 0;
  }
  
  return {
    totalUsers,
    statusDistribution: {
      active: activeUsers,
      suspended: suspendedUsers,
      frozen: frozenUsers
    },
    roleDistribution: {
      clientuser: userRole,
      consultant: consultantRole,
      ...(currentUser.role === 'superadmin' ? { superadmin: superadminRole } : {})
    },
    assignments: {
      withClient: usersWithClient,
      withDepartment: usersWithDepartment
    },
    recentActivity: {
      recentRegistrations,
      usersWithLastLogin
    },
    ...(currentUser.role === 'superadmin' ? {
      averages: {
        usersPerClient: avgUsersPerClient
      }
    } : {})
  };
};
