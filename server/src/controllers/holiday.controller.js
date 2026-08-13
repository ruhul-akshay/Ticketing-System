import * as holidayService from '../services/holiday.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getHolidays = asyncHandler(async (req, res) => {
  const { financialYear, search } = req.query;
  const holidays = await holidayService.fetchHolidays(financialYear, search);
  res.json({ success: true, holidays });
});

export const createHoliday = asyncHandler(async (req, res) => {
  const holiday = await holidayService.addHoliday(req.body, req.user._id);
  res.status(201).json({ success: true, holiday });
});

export const updateHoliday = asyncHandler(async (req, res) => {
  const holiday = await holidayService.editHoliday(req.params.id, req.body, req.user._id);
  res.json({ success: true, holiday });
});

export const deleteHoliday = asyncHandler(async (req, res) => {
  await holidayService.removeHoliday(req.params.id, req.user._id);
  res.json({ success: true, message: 'Holiday deleted successfully' });
});

export const getWeekendConfig = asyncHandler(async (req, res) => {
  const { financialYear } = req.query;
  const config = await holidayService.fetchWeekendConfig(financialYear);
  res.json({ success: true, config });
});

export const saveWeekendConfig = asyncHandler(async (req, res) => {
  const { config, countGenerated } = await holidayService.updateWeekendConfig(req.body, req.user._id);
  const autoGenerate = req.body.autoGenerate;

  res.json({
    success: true,
    config,
    message: autoGenerate
      ? `Weekend configuration saved and ${countGenerated} weekend entries generated successfully.`
      : 'Weekend configuration saved successfully.'
  });
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, search } = req.query;
  const logs = await holidayService.fetchAuditLogs(action, search);
  res.json({ success: true, logs });
});
