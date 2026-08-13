import * as authService from '../services/auth.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  
  // Set httpOnly cookie for security
  res.cookie('token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json(result);
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  res.json(result);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await authService.resetPassword(token, newPassword);
  res.json(result);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
  res.json(result);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, employeeCode, clientName } = req.body;
  const updatedUser = await authService.updateProfile(req.user._id, req.user, { name, employeeCode, clientName });
  
  res.json({ 
    message: 'Profile updated successfully',
    user: updatedUser 
  });
});

export const completeProfile = asyncHandler(async (req, res) => {
  const { name, phoneNumber, position } = req.body;
  const updatedUser = await authService.completeProfile(req.user._id, { name, phoneNumber, position });

  res.json({
    message: 'Profile completed successfully',
    user: {
      id: updatedUser._id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      department: updatedUser.department,
      clientName: updatedUser.clientName,
      client: updatedUser.client,
      phoneNumber: updatedUser.phoneNumber,
      position: updatedUser.position,
      isFirstLogin: false,
      isPrimaryContact: updatedUser.isPrimaryContact || false
    }
  });
});
