import CcEmailConfig from '../models/CcEmailConfig.js';
import { AppError } from '../utils/AppError.js';

export const fetchAllConfigs = async () => {
  return await CcEmailConfig.find().sort({ createdAt: -1 });
};

export const createCcConfig = async (data) => {
  const { email } = data;
  if (!email) {
    throw new AppError('Email address is required', 400);
  }

  const emailLower = email.toLowerCase().trim();
  const existing = await CcEmailConfig.findOne({ email: emailLower });
  if (existing) {
    throw new AppError('CC configuration for this email already exists', 400);
  }

  const newConfig = new CcEmailConfig({
    email: emailLower,
    client_created: !!data.client_created,
    client_user_created: !!data.client_user_created,
    ticket_created: !!data.ticket_created,
    ticket_status_updated: !!data.ticket_status_updated,
    ticket_assigned: !!data.ticket_assigned,
    ticket_closed: !!data.ticket_closed,
    password_reset: !!data.password_reset,
    new_message: !!data.new_message,
    isActive: data.isActive !== undefined ? !!data.isActive : true
  });

  await newConfig.save();
  return newConfig;
};

export const updateCcConfig = async (id, data) => {
  const config = await CcEmailConfig.findById(id);
  if (!config) {
    throw new AppError('CC configuration not found', 404);
  }

  if (data.email) {
    const emailLower = data.email.toLowerCase().trim();
    if (emailLower !== config.email) {
      const existing = await CcEmailConfig.findOne({ email: emailLower });
      if (existing) {
        throw new AppError('CC configuration for this email already exists', 400);
      }
      config.email = emailLower;
    }
  }

  if (data.client_created !== undefined) config.client_created = !!data.client_created;
  if (data.client_user_created !== undefined) config.client_user_created = !!data.client_user_created;
  if (data.ticket_created !== undefined) config.ticket_created = !!data.ticket_created;
  if (data.ticket_status_updated !== undefined) config.ticket_status_updated = !!data.ticket_status_updated;
  if (data.ticket_assigned !== undefined) config.ticket_assigned = !!data.ticket_assigned;
  if (data.ticket_closed !== undefined) config.ticket_closed = !!data.ticket_closed;
  if (data.password_reset !== undefined) config.password_reset = !!data.password_reset;
  if (data.new_message !== undefined) config.new_message = !!data.new_message;
  if (data.isActive !== undefined) config.isActive = !!data.isActive;

  await config.save();
  return config;
};

export const deleteCcConfig = async (id) => {
  const config = await CcEmailConfig.findByIdAndDelete(id);
  if (!config) {
    throw new AppError('CC configuration not found', 404);
  }
  return config;
};
