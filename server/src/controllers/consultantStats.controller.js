import * as consultantStatsService from '../services/consultantStats.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getMyStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await consultantStatsService.getMyConsultantStats(req.user, { startDate, endDate });
  res.json({ success: true, data: stats });
});

export const getAllConsultantsStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const summaries = await consultantStatsService.getAllConsultantsStatsSummary({ startDate, endDate });
  res.json({ success: true, data: summaries });
});

export const getConsultantStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await consultantStatsService.getSpecificConsultantStats(req.params.consultantId, { startDate, endDate });
  res.json({ success: true, data: stats });
});
