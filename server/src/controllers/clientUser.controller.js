import * as clientUserService from '../services/clientUser.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getUsers = asyncHandler(async (req, res) => {
  const result = await clientUserService.getAllUsers(req.user, req.query);
  res.json({
    success: true,
    users: result.users,
    stats: result.stats,
    companies: result.companies,
    pagination: {
      page: parseInt(req.query.page || 1),
      limit: parseInt(req.query.limit || 1000),
      total: result.total,
      pages: Math.ceil(result.total / (req.query.limit || 1000))
    }
  });
});

export const getUsersByRole = asyncHandler(async (req, res) => {
  const result = await clientUserService.getUsersByRole(req.user, req.params.role, req.query);
  res.json({
    success: true,
    users: result.users,
    stats: result.stats,
    role: req.params.role,
    pagination: {
      page: parseInt(req.query.page || 1),
      limit: parseInt(req.query.limit || 1000),
      total: result.total,
      pages: Math.ceil(result.total / (req.query.limit || 1000))
    }
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await clientUserService.getUserById(req.user, req.user._id.toString());
  res.json({
    success: true,
    user
  });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await clientUserService.getUserById(req.user, req.params.id);
  res.json({
    success: true,
    user
  });
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await clientUserService.createUser(req.user, req.body);
  const role = req.body.role || 'clientuser';
  res.status(201).json({
    success: true,
    message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
    user
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await clientUserService.updateUser(req.user, req.params.id, req.body);
  res.json({
    success: true,
    message: 'User updated successfully',
    user
  });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const result = await clientUserService.updateUserStatus(req.user, req.params.id, req.body);
  res.json({
    success: true,
    message: `User status updated to ${req.body.status}`,
    user: result
  });
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  await clientUserService.resetUserPassword(req.user, req.params.id, req.body.newPassword);
  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

export const updateOwnPassword = asyncHandler(async (req, res) => {
  await clientUserService.updateOwnPassword(req.user, req.body);
  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  await clientUserService.deleteUser(req.user, req.params.id);
  res.json({
    success: true,
    message: 'Client User deleted successfully'
  });
});

export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await clientUserService.getUserStatsOverview(req.user);
  res.json({
    success: true,
    ...stats
  });
});
