import * as dashboardService from '../services/dashboard.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getStats = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardStats(req.user);
  res.json(data);
});
