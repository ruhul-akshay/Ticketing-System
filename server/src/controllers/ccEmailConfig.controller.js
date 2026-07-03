import CcEmailConfig from '../models/CcEmailConfig.js';

export const getAllConfigs = async (req, res) => {
  try {
    const configs = await CcEmailConfig.find().sort({ createdAt: -1 });
    res.json({ success: true, configs });
  } catch (error) {
    console.error('Error fetching CC email configs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch CC email configs', error: error.message });
  }
};

export const createConfig = async (req, res) => {
  try {
    const {
      email,
      client_created,
      client_user_created,
      ticket_created,
      ticket_status_updated,
      ticket_assigned,
      ticket_closed,
      password_reset,
      new_message,
      isActive
    } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const emailLower = email.toLowerCase().trim();
    const existing = await CcEmailConfig.findOne({ email: emailLower });
    if (existing) {
      return res.status(400).json({ success: false, message: 'CC configuration for this email already exists' });
    }

    const newConfig = new CcEmailConfig({
      email: emailLower,
      client_created: !!client_created,
      client_user_created: !!client_user_created,
      ticket_created: !!ticket_created,
      ticket_status_updated: !!ticket_status_updated,
      ticket_assigned: !!ticket_assigned,
      ticket_closed: !!ticket_closed,
      password_reset: !!password_reset,
      new_message: !!new_message,
      isActive: isActive !== undefined ? !!isActive : true
    });

    await newConfig.save();
    res.status(201).json({ success: true, message: 'CC Email configuration created successfully', config: newConfig });
  } catch (error) {
    console.error('Error creating CC email config:', error);
    res.status(500).json({ success: false, message: 'Failed to create CC email config', error: error.message });
  }
};

export const updateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      client_created,
      client_user_created,
      ticket_created,
      ticket_status_updated,
      ticket_assigned,
      ticket_closed,
      password_reset,
      new_message,
      isActive
    } = req.body;

    const config = await CcEmailConfig.findById(id);
    if (!config) {
      return res.status(404).json({ success: false, message: 'CC configuration not found' });
    }

    if (email) {
      const emailLower = email.toLowerCase().trim();
      if (emailLower !== config.email) {
        const existing = await CcEmailConfig.findOne({ email: emailLower });
        if (existing) {
          return res.status(400).json({ success: false, message: 'CC configuration for this email already exists' });
        }
        config.email = emailLower;
      }
    }

    if (client_created !== undefined) config.client_created = !!client_created;
    if (client_user_created !== undefined) config.client_user_created = !!client_user_created;
    if (ticket_created !== undefined) config.ticket_created = !!ticket_created;
    if (ticket_status_updated !== undefined) config.ticket_status_updated = !!ticket_status_updated;
    if (ticket_assigned !== undefined) config.ticket_assigned = !!ticket_assigned;
    if (ticket_closed !== undefined) config.ticket_closed = !!ticket_closed;
    if (password_reset !== undefined) config.password_reset = !!password_reset;
    if (new_message !== undefined) config.new_message = !!new_message;
    if (isActive !== undefined) config.isActive = !!isActive;

    await config.save();
    res.json({ success: true, message: 'CC Email configuration updated successfully', config });
  } catch (error) {
    console.error('Error updating CC email config:', error);
    res.status(500).json({ success: false, message: 'Failed to update CC email config', error: error.message });
  }
};

export const deleteConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const config = await CcEmailConfig.findByIdAndDelete(id);
    if (!config) {
      return res.status(404).json({ success: false, message: 'CC configuration not found' });
    }
    res.json({ success: true, message: 'CC Email configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting CC email config:', error);
    res.status(500).json({ success: false, message: 'Failed to delete CC email config', error: error.message });
  }
};
