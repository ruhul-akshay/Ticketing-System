import * as consultantProfileService from '../services/consultantProfile.service.js';

export const getConsultantProfiles = async (req, res) => {
  try {
    const profiles = await consultantProfileService.getAllConsultantProfiles(req.user);
    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error('Error fetching consultant profiles:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch consultant profiles', 
      error: error.message 
    });
  }
};

export const getConsultantProfilesByDept = async (req, res) => {
  try {
    const profiles = await consultantProfileService.getConsultantProfilesByDepartment(req.user, req.params.departmentId);
    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error('Error fetching profiles by department:', error);
    if (error.message.includes('own department')) {
      res.status(403).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch profiles', 
        error: error.message 
      });
    }
  }
};

export const getConsultantProfile = async (req, res) => {
  try {
    const profile = await consultantProfileService.getConsultantProfileById(req.user, req.params.id);
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching consultant profile:', error);
    if (error.message === 'Consultant profile not found') {
      res.status(404).json({ success: false, message: error.message });
    } else if (error.message.includes('permission') || error.message.includes('own department')) {
      res.status(403).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch consultant profile', 
        error: error.message 
      });
    }
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const profile = await consultantProfileService.getMyConsultantProfile(req.user);
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching my profile:', error);
    if (error.message === 'Consultant profile not found') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch profile', 
        error: error.message 
      });
    }
  }
};

export const createProfile = async (req, res) => {
  try {
    const profile = await consultantProfileService.createConsultantProfile(req.body);
    res.status(201).json({
      success: true,
      message: 'Consultant profile created successfully',
      data: profile
    });
  } catch (error) {
    console.error('Error creating consultant profile:', error);
    if (error.message.includes('already exists') || error.message.includes('at least 6')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to create consultant profile', 
        error: error.message 
      });
    }
  }
};

export const updateProfile = async (req, res) => {
  try {
    const profile = await consultantProfileService.updateConsultantProfile(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Consultant profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Error updating consultant profile:', error);
    if (error.message === 'Consultant profile not found') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to update consultant profile', 
        error: error.message 
      });
    }
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const profile = await consultantProfileService.updateMyConsultantProfile(req.user, req.body);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Error updating my profile:', error);
    if (error.message === 'Consultant profile not found') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to update profile', 
        error: error.message 
      });
    }
  }
};

export const updateLimitedProfile = async (req, res) => {
  try {
    const profile = await consultantProfileService.updateLimitedConsultantProfile(req.user, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.message === 'Consultant profile not found') {
      res.status(404).json({ success: false, message: error.message });
    } else if (error.message.includes('own department')) {
      res.status(403).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to update profile', 
        error: error.message 
      });
    }
  }
};

export const deleteProfile = async (req, res) => {
  try {
    await consultantProfileService.deleteConsultantProfile(req.params.id);
    res.json({ 
      success: true,
      message: 'Consultant profile deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting consultant profile:', error);
    if (error.message === 'Consultant profile not found') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to delete consultant profile', 
        error: error.message 
      });
    }
  }
};

export const searchProfiles = async (req, res) => {
  try {
    const profiles = await consultantProfileService.searchConsultantProfiles(req.user, req.query.query);
    res.json({
      success: true,
      data: profiles,
      count: profiles.length
    });
  } catch (error) {
    console.error('Error searching consultant profiles:', error);
    if (error.message.includes('required')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to search consultant profiles', 
        error: error.message 
      });
    }
  }
};

export const logAccess = (req, res, next) => {
  console.log('ConsultantProfiles Route Access:', {
    path: req.path,
    method: req.method,
    userRole: req.user?.role,
    userId: req.user?._id
  });
  next();
};
