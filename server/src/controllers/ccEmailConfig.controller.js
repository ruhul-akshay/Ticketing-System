import * as ccEmailConfigService from '../services/ccEmailConfig.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAllConfigs = asyncHandler(async (req, res) => {
  const configs = await ccEmailConfigService.fetchAllConfigs();
  res.json({ success: true, configs });
});

export const createConfig = asyncHandler(async (req, res) => {
  const config = await ccEmailConfigService.createCcConfig(req.body);
  res.status(201).json({ success: true, message: 'CC Email configuration created successfully', config });
});

export const updateConfig = asyncHandler(async (req, res) => {
  const config = await ccEmailConfigService.updateCcConfig(req.params.id, req.body);
  res.json({ success: true, message: 'CC Email configuration updated successfully', config });
});

export const deleteConfig = asyncHandler(async (req, res) => {
  await ccEmailConfigService.deleteCcConfig(req.params.id);
  res.json({ success: true, message: 'CC Email configuration deleted successfully' });
});
