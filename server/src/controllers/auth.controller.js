import * as authService from '../services/auth.service.js';

export const register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    
    // Set cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json(result);
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      res.status(401).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (error) {
    if (error.message === 'Client User not found with this email') {
      res.status(404).json({ message: 'No account found with that email address.' });
    } else {
      res.status(500).json({ message: 'Failed to send temporary password. Please try again later.' });
    }
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    res.json(result);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Reset token has expired' });
    }
    if (error.message === 'Client User not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    if (error.message === 'Client User not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Current password is incorrect') {
      return res.status(401).json({ message: error.message });
    }
    if (error.message === 'New password must be at least 6 characters') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, employeeCode, clientName } = req.body;
    const updatedUser = await authService.updateProfile(req.user._id, req.user, { name, employeeCode, clientName });
    
    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.message === 'Name must be at least 2 characters' || error.message === 'Employee code already exists') {
      res.status(400).json({ message: error.message });
    } else if (error.message === 'Client User not found') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
  }
};

export const completeProfile = async (req, res) => {
  try {
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
        isFirstLogin: false
      }
    });
  } catch (error) {
    console.error('Error completing profile:', error);
    if (error.message === 'Name must be at least 2 characters') {
      res.status(400).json({ message: error.message });
    } else if (error.message === 'User not found') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to complete profile', error: error.message });
    }
  }
};
