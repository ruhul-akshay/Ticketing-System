import * as consultantProfileService from '../services/consultantProfile.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';

export const getConsultantProfiles = asyncHandler(async (req, res) => {
  const profiles = await consultantProfileService.getAllConsultantProfiles(req.user);
  res.json({
    success: true,
    data: profiles
  });
});

export const getConsultantProfilesByDept = asyncHandler(async (req, res) => {
  const profiles = await consultantProfileService.getConsultantProfilesByDepartment(req.user, req.params.departmentId);
  res.json({
    success: true,
    data: profiles
  });
});

export const getConsultantProfile = asyncHandler(async (req, res) => {
  const profile = await consultantProfileService.getConsultantProfileById(req.user, req.params.id);
  res.json({
    success: true,
    data: profile
  });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await consultantProfileService.getMyConsultantProfile(req.user);
  res.json({
    success: true,
    data: profile
  });
});

export const createProfile = asyncHandler(async (req, res) => {
  const profile = await consultantProfileService.createConsultantProfile(req.body);
  res.status(201).json({
    success: true,
    message: 'Consultant profile created successfully',
    data: profile
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await consultantProfileService.updateConsultantProfile(req.params.id, req.body);
  res.json({
    success: true,
    message: 'Consultant profile updated successfully',
    data: profile
  });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await consultantProfileService.updateMyConsultantProfile(req.user, req.body);
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: profile
  });
});

export const updateLimitedProfile = asyncHandler(async (req, res) => {
  const profile = await consultantProfileService.updateLimitedConsultantProfile(req.user, req.params.id, req.body);
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: profile
  });
});

export const deleteProfile = asyncHandler(async (req, res) => {
  await consultantProfileService.deleteConsultantProfile(req.params.id);
  res.json({ 
    success: true,
    message: 'Consultant profile deleted successfully' 
  });
});

export const searchProfiles = asyncHandler(async (req, res) => {
  const profiles = await consultantProfileService.searchConsultantProfiles(req.user, req.query.query);
  res.json({
    success: true,
    data: profiles,
    count: profiles.length
  });
});

export const logAccess = (req, res, next) => {
  logger.info('ConsultantProfiles Route Access:', {
    path: req.path,
    method: req.method,
    userRole: req.user?.role,
    userId: req.user?._id
  });
  next();
};
