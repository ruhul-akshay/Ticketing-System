import * as consultantStatsService from '../services/consultantStats.service.js';

export const getMyStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await consultantStatsService.getMyConsultantStats(req.user, { startDate, endDate });
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Consultant stats /me error:', error);
    if (error.message === 'ClientUser not found' || error.message === 'User not found' || error.message === 'Consultant user not found') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Failed to load consultant stats', error: error.message });
    }
  }
};

export const getAllConsultantsStats = async (req, res) => {
  try {
    const summaries = await consultantStatsService.getAllConsultantsStatsSummary();
    res.json({ success: true, data: summaries });
  } catch (error) {
    console.error('Consultant stats list error:', error);
    res.status(500).json({ success: false, message: 'Failed to load consultant stats', error: error.message });
  }
};

export const getConsultantStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await consultantStatsService.getSpecificConsultantStats(req.params.consultantId, { startDate, endDate });
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Consultant stats /:consultantId error:', error);
    if (error.message === 'Invalid consultant ID format') {
      res.status(400).json({ success: false, message: error.message });
    } else if (error.message === 'Consultant user not found') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Failed to load consultant stats', error: error.message });
    }
  }
};
