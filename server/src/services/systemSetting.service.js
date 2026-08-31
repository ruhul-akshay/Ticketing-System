import SystemSetting from '../models/SystemSetting.js';
import { AppError } from '../utils/AppError.js';
import { invalidateCompanyShortNameCache } from '../email/transporter.js';

export const fetchSystemSettings = async () => {
  const settings = await SystemSetting.find({});
  const settingsMap = {};
  settings.forEach(s => {
    settingsMap[s.key] = s.value;
  });
  // Ensure default settings exist if not already defined
  if (settingsMap['showBillingToConsultants'] === undefined) {
    settingsMap['showBillingToConsultants'] = false; // Default: hide billing
  }
  return settingsMap;
};

export const updateSystemSetting = async (key, value) => {
  if (!key) {
    throw new AppError('Key is required', 400);
  }

  let setting = await SystemSetting.findOne({ key });
  if (setting) {
    setting.value = value;
    await setting.save();
  } else {
    setting = await SystemSetting.create({ key, value });
  }

  // Bust the email transporter's company short name cache immediately
  // when the companyShortName setting is updated.
  if (key === 'companyShortName') {
    invalidateCompanyShortNameCache();
  }

  return setting;
};
