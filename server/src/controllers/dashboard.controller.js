import * as dashboardService from '../services/dashboard.service.js';

export const getStats = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardStats(req.user);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
