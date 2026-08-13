import * as systemSettingService from '../services/systemSetting.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getSettings = asyncHandler(async (req, res) => {
  const settingsMap = await systemSettingService.fetchSystemSettings();
  res.json({ success: true, settings: settingsMap });
});

export const updateSetting = asyncHandler(async (req, res) => {
  const { key, value } = req.body;
  const setting = await systemSettingService.updateSystemSetting(key, value);
  res.json({ success: true, setting });
});
