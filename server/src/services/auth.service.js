import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import ClientUser from '../models/ClientUser.js';
import { sendTemporaryPasswordEmail } from '../utils/email.js';

export const registerUser = async ({ email, password, name, employeeCode, role }) => {
  if (!email || !password || !name) {
    throw new Error('Email, password, and name are required');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const existingUser = await ClientUser.findOne({ email });
  if (existingUser) {
    throw new Error('Client ClientUser already exists');
  }

  if (employeeCode) {
    const existingCode = await ClientUser.findOne({ employeeCode });
    if (existingCode) {
      throw new Error('Employee code already exists');
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = new ClientUser({
    email,
    password: hashedPassword,
    name,
    employeeCode,
    role: role || 'clientuser'
  });

  await user.save();
  return { message: 'Client ClientUser created successfully' };
};

export const loginUser = async ({ email, password }) => {
  const user = await ClientUser.findOne({ email }).populate('department');
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('Server configuration error');
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Self-heal: set isPrimaryContact to true if it is a clientuser and has no creator
  if (user.role === 'clientuser' && !user.isPrimaryContact && !user.createdBy) {
    user.isPrimaryContact = true;
  }

  // Record last login timestamp
  user.lastLogin = new Date();
  await user.save();

  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      clientName: user.clientName,
      client: user.client,
      isFirstLogin: user.isFirstLogin || false,
      isPrimaryContact: user.isPrimaryContact || false
    },
    token
  };
};

/**
 * Generates a secure random temporary password, saves its hash to the user record,
 * and emails the plain-text version to the user's registered email address.
 */
export const forgotPassword = async (email) => {
  const user = await ClientUser.findOne({ email });
  if (!user) {
    throw new Error('Client User not found with this email');
  }

  // Generate a cryptographically random 10-character temporary password
  // Format: 4 uppercase + 4 digits + 2 special chars  → e.g. ABCD1234!@
  const upper  = crypto.randomBytes(4).toString('hex').slice(0, 4).toUpperCase();
  const digits = String(Math.floor(Math.random() * 9000) + 1000);       // 4-digit number
  const specials = ['!', '@', '#', '$', '%', '&'][Math.floor(Math.random() * 6)];
  const tempPassword = `${upper}${digits}${specials}`;

  // Hash and persist
  const hashedTemp = await bcrypt.hash(tempPassword, 12);
  user.password = hashedTemp;
  await user.save();

  // Send branded email with the temp password
  await sendTemporaryPasswordEmail(email, user.name, tempPassword);

  console.log(`✅ Temporary password issued for: ${email}`);

  return { message: 'A temporary password has been sent to your registered email address.' };
};

export const resetPassword = async (token, newPassword) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  const user = await ClientUser.findById(decoded.userId);
  
  if (!user) {
    throw new Error('Client ClientUser not found');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  return { message: 'Password reset successfully' };
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await ClientUser.findById(userId);
  if (!user) {
    throw new Error('Client ClientUser not found');
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;
  await user.save();

  return { message: 'Password changed successfully' };
};

export const completeProfile = async (userId, { name, phoneNumber, position }) => {
  if (!name || name.trim().length < 2) {
    throw new Error('Name must be at least 2 characters');
  }

  const updatedUser = await ClientUser.findByIdAndUpdate(
    userId,
    {
      name: name.trim(),
      phoneNumber: phoneNumber?.trim() || '',
      position: position?.trim() || '',
      isFirstLogin: false
    },
    { new: true, runValidators: true }
  ).select('-password').populate('department');

  if (!updatedUser) {
    throw new Error('User not found');
  }

  return updatedUser;
};

export const updateProfile = async (userId, userObj, { name, employeeCode, clientName }) => {
  if (name && name.trim().length < 2) {
    throw new Error('Name must be at least 2 characters');
  }

  if (employeeCode && employeeCode !== userObj.employeeCode) {
    const existingUser = await ClientUser.findOne({ employeeCode, _id: { $ne: userId } });
    if (existingUser) {
      throw new Error('Employee code already exists');
    }
  }

  const updateData = {};
  if (name) updateData.name = name.trim();
  if (employeeCode !== undefined) updateData.employeeCode = employeeCode.trim() || null;
  if (clientName !== undefined) updateData.clientName = clientName.trim();

  const updatedUser = await ClientUser.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password').populate('department');

  if (!updatedUser) {
    throw new Error('Client ClientUser not found');
  }

  return updatedUser;
};
