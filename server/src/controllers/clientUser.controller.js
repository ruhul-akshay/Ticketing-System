import * as clientUserService from '../services/clientUser.service.js';

export const getUsers = async (req, res) => {
  try {
    const result = await clientUserService.getAllUsers(req.user, req.query);
    res.json({
      success: true,
      users: result.users,
      stats: result.stats,
      companies: result.companies,
      pagination: {
        page: parseInt(req.query.page || 1),
        limit: parseInt(req.query.limit || 20),
        total: result.total,
        pages: Math.ceil(result.total / (req.query.limit || 20))
      }
    });
  } catch (error) {
    console.error('Error fetching client users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client users',
      error: error.message
    });
  }
};

export const getUsersByRole = async (req, res) => {
  try {
    const result = await clientUserService.getUsersByRole(req.user, req.params.role, req.query);
    res.json({
      success: true,
      users: result.users,
      stats: result.stats,
      role: req.params.role,
      pagination: {
        page: parseInt(req.query.page || 1),
        limit: parseInt(req.query.limit || 20),
        total: result.total,
        pages: Math.ceil(result.total / (req.query.limit || 20))
      }
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.role}s:`, error);
    if (error.message === 'Invalid role specified') {
      res.status(400).json({ success: false, message: error.message });
    } else if (error.message === 'Access denied to superadmin data') {
      res.status(403).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to fetch ${req.params.role}s`,
        error: error.message
      });
    }
  }
};

export const getProfile = async (req, res) => {
  try {
    // Current profile of req.user
    const user = await clientUserService.getUserById(req.user, req.user._id.toString());
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client user profile',
      error: error.message
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await clientUserService.getUserById(req.user, req.params.id);
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching client user:', error);
    if (error.message === 'Access Denied' || error.message.includes('Access denied')) {
      res.status(403).json({ success: false, message: error.message });
    } else if (error.message === 'Client User not found') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch client user',
        error: error.message
      });
    }
  }
};

export const createUser = async (req, res) => {
  try {
    const user = await clientUserService.createUser(req.user, req.body);
    const role = req.body.role || 'clientuser';
    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
      user
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.message === 'Email, password, and name are required' || error.message.includes('Invalid role') || error.message === 'Client not found' || error.message === 'Department not found' || error.message === 'User with this email or employee code already exists') {
      res.status(400).json({ success: false, message: error.message });
    } else if (error.message.includes('You can only create users')) {
      res.status(403).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    }
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await clientUserService.updateUser(req.user, req.params.id, req.body);
    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.message === 'Client User not found') {
      res.status(404).json({ success: false, message: error.message });
    } else if (error.message === 'Access Denied' || error.message.includes('You can only update') || error.message.includes('You cannot update superadmin')) {
      res.status(403).json({ success: false, message: error.message });
    } else if (error.message.includes('You cannot change your own') || error.message.includes('Invalid role') || error.message === 'Employee code already in use' || error.message === 'Client not found' || error.message === 'Department not found') {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    }
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const result = await clientUserService.updateUserStatus(req.user, req.params.id, req.body);
    res.json({
      success: true,
      message: `User status updated to ${req.body.status}`,
      user: result
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    if (error.message === 'Client User not found') {
      res.status(404).json({ success: false, message: error.message });
    } else if (error.message.includes('You can only update') || error.message.includes('You cannot update superadmin') || error.message.includes('Only superadmin can update')) {
      res.status(403).json({ success: false, message: error.message });
    } else if (error.message.includes('Invalid status') || error.message.includes('You cannot change your own status')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: error.message
      });
    }
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    await clientUserService.resetUserPassword(req.user, req.params.id, req.body.newPassword);
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    if (error.message === 'Client User not found') {
      res.status(404).json({ success: false, message: error.message });
    } else if (error.message.includes('You can only reset') || error.message.includes('You cannot reset superadmin')) {
      res.status(403).json({ success: false, message: error.message });
    } else if (error.message.includes('New password must be')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to reset password',
        error: error.message
      });
    }
  }
};

export const updateOwnPassword = async (req, res) => {
  try {
    await clientUserService.updateOwnPassword(req.user, req.body);
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    if (error.message.includes('required') || error.message.includes('at least 6') || error.message.includes('incorrect')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update password',
        error: error.message
      });
    }
  }
};

export const deleteUser = async (req, res) => {
  try {
    await clientUserService.deleteUser(req.user, req.params.id);
    res.json({
      success: true,
      message: 'Client User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.message === 'Client User not found') {
      res.status(404).json({ success: false, message: error.message });
    } else if (error.message.includes('Cannot delete other')) {
      res.status(403).json({ success: false, message: error.message });
    } else if (error.message.includes('You cannot delete your own') || error.message.includes('Cannot delete user with existing tickets')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  }
};

export const getUserStats = async (req, res) => {
  try {
    const stats = await clientUserService.getUserStatsOverview(req.user);
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client user statistics',
      error: error.message
    });
  }
};
