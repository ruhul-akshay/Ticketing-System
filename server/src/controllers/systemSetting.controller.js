import SystemSetting from '../models/SystemSetting.js';

export const getSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.find({});
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    // Ensure default settings exist if not already defined
    if (settingsMap['showBillingToConsultants'] === undefined) {
      settingsMap['showBillingToConsultants'] = false; // Default: hide billing
    }
    res.json({ success: true, settings: settingsMap });
  } catch (error) {
    console.error('Failed to get system settings:', error);
    res.status(500).json({ success: false, message: 'Failed to get system settings', error: error.message });
  }
};

export const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ success: false, message: 'Key is required' });
    }
    
    let setting = await SystemSetting.findOne({ key });
    if (setting) {
      setting.value = value;
      await setting.save();
    } else {
      setting = await SystemSetting.create({ key, value });
    }
    res.json({ success: true, setting });
  } catch (error) {
    console.error('Failed to update system setting:', error);
    res.status(500).json({ success: false, message: 'Failed to update system setting', error: error.message });
  }
};
