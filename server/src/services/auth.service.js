import bcrypt     from 'bcryptjs';
import jwt        from 'jsonwebtoken';
import crypto     from 'crypto';
import ClientUser from '../models/ClientUser.js';
import { AppError } from '../utils/AppError.js';
import { logger }   from '../utils/logger.js';
import { sendTemporaryPasswordEmail } from '../utils/email.js';

export const registerUser = async ({ email, password, name, employeeCode, role }) => {
  if (!email || !password || !name) {
    throw new AppError('Email, password, and name are required', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }

  const existingUser = await ClientUser.findOne({ email });
  if (existingUser) {
    throw new AppError('A user with this email already exists', 409);
  }

  if (employeeCode) {
    const existingCode = await ClientUser.findOne({ employeeCode });
    if (existingCode) {
      throw new AppError('Employee code already exists', 409);
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
  return { message: 'User created successfully' };
};

export const loginUser = async ({ email, password }) => {
  const user = await ClientUser.findOne({ email }).populate('department');
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!process.env.JWT_SECRET) {
    throw new AppError('Server configuration error', 500);
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Self-heal: set isPrimaryContact to true if this is a standalone client user
  if (user.role === 'clientuser' && !user.isPrimaryContact && !user.createdBy) {
    user.isPrimaryContact = true;
  }

  // Record last login timestamp
  user.previousLastLogin = user.lastLogin || user.createdAt;
  user.lastLogin = new Date();
  await user.save();

  return {
    user: {
      id:                user._id,
      email:             user.email,
      name:              user.name,
      role:              user.role,
      department:        user.department,
      clientName:        user.clientName,
      client:            user.client,
      isFirstLogin:      user.isFirstLogin  || false,
      isPrimaryContact:  user.isPrimaryContact || false,
      previousLastLogin: user.previousLastLogin
    },
    token
  };
};

/**
 * Generates a secure random temporary password, saves its hash to the user
 * record, and emails the plain-text version to the registered address.
 */
export const forgotPassword = async (email) => {
  const user = await ClientUser.findOne({ email });
  if (!user) {
    throw new AppError('No account found with that email address.', 404);
  }

  // Format: 4 uppercase letters + 4 digits + 1 special char  (e.g. ABCD1234!)
  const upper    = crypto.randomBytes(4).toString('hex').slice(0, 4).toUpperCase();
  const digits   = String(Math.floor(Math.random() * 9000) + 1000);
  const specials = ['!', '@', '#', '$', '%', '&'][Math.floor(Math.random() * 6)];
  const tempPassword = `${upper}${digits}${specials}`;

  user.password = await bcrypt.hash(tempPassword, 12);
  await user.save();

  await sendTemporaryPasswordEmail(email, user.name, tempPassword);

  logger.info(`Temporary password issued for: ${email}`);
  return { message: 'A temporary password has been sent to your registered email address.' };
};

export const resetPassword = async (token, newPassword) => {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch {
    throw new AppError('Reset token is invalid or has expired.', 400);
  }

  const user = await ClientUser.findById(decoded.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return { message: 'Password reset successfully' };
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await ClientUser.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 401);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters', 400);
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  return { message: 'Password changed successfully' };
};

export const completeProfile = async (userId, { name, phoneNumber, position }) => {
  if (!name || name.trim().length < 2) {
    throw new AppError('Name must be at least 2 characters', 400);
  }

  const updatedUser = await ClientUser.findByIdAndUpdate(
    userId,
    {
      name:        name.trim(),
      phoneNumber: phoneNumber?.trim() || '',
      position:    position?.trim()    || '',
      isFirstLogin: false
    },
    { new: true, runValidators: true }
  ).select('-password').populate('department');

  if (!updatedUser) {
    throw new AppError('User not found', 404);
  }

  return updatedUser;
};

export const updateProfile = async (userId, userObj, { name, employeeCode, clientName }) => {
  if (name && name.trim().length < 2) {
    throw new AppError('Name must be at least 2 characters', 400);
  }

  if (employeeCode && employeeCode !== userObj.employeeCode) {
    const existingUser = await ClientUser.findOne({ employeeCode, _id: { $ne: userId } });
    if (existingUser) {
      throw new AppError('Employee code already exists', 409);
    }
  }

  const updateData = {};
  if (name)                    updateData.name          = name.trim();
  if (employeeCode !== undefined) updateData.employeeCode = employeeCode?.trim() || null;
  if (clientName   !== undefined) updateData.clientName  = clientName.trim();

  const updatedUser = await ClientUser.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password').populate('department');

  if (!updatedUser) {
    throw new AppError('User not found', 404);
  }

  return updatedUser;
};
