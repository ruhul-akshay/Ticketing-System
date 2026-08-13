import Holiday from '../models/Holiday.js';
import WeekendConfig from '../models/WeekendConfig.js';
import HolidayAuditLog from '../models/HolidayAuditLog.js';
import { AppError } from '../utils/AppError.js';

export const logAction = async (action, details, userId) => {
  try {
    await HolidayAuditLog.create({
      action,
      details,
      performedBy: userId
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
};

export const fetchHolidays = async (financialYear, search) => {
  const query = {};

  if (financialYear) {
    query.financialYear = financialYear;
  }

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  return await Holiday.find(query).sort({ date: 1 });
};

export const addHoliday = async (data, userId) => {
  const { name, date, type, financialYear, description } = data;

  if (!name || !date || !financialYear) {
    throw new AppError('Name, date, and Financial Year are required', 400);
  }

  const holidayDate = new Date(date);
  holidayDate.setHours(0, 0, 0, 0);

  const existing = await Holiday.findOne({ date: holidayDate });
  if (existing) {
    throw new AppError(`A holiday already exists on ${holidayDate.toLocaleDateString()}`, 400);
  }

  const holiday = await Holiday.create({
    name,
    date: holidayDate,
    type: type || 'full',
    financialYear,
    description,
    createdBy: userId
  });

  await logAction(
    'CREATE',
    `Holiday '${name}' (${type || 'full'}) created on ${holidayDate.toLocaleDateString()} for FY ${financialYear}`,
    userId
  );

  return holiday;
};

export const editHoliday = async (id, data, userId) => {
  const { name, date, type, financialYear, description } = data;

  const holiday = await Holiday.findById(id);
  if (!holiday) {
    throw new AppError('Holiday not found', 404);
  }

  let holidayDate = holiday.date;
  if (date) {
    holidayDate = new Date(date);
    holidayDate.setHours(0, 0, 0, 0);

    const duplicate = await Holiday.findOne({ date: holidayDate, _id: { $ne: id } });
    if (duplicate) {
      throw new AppError(`A holiday already exists on ${holidayDate.toLocaleDateString()}`, 400);
    }
  }

  const originalName = holiday.name;
  const originalDate = holiday.date;

  holiday.name = name || holiday.name;
  holiday.date = holidayDate;
  holiday.type = type || holiday.type;
  holiday.financialYear = financialYear || holiday.financialYear;
  holiday.description = description !== undefined ? description : holiday.description;
  holiday.updatedBy = userId;

  await holiday.save();

  await logAction(
    'UPDATE',
    `Holiday updated: '${originalName}' on ${originalDate.toLocaleDateString()} -> '${holiday.name}' on ${holiday.date.toLocaleDateString()}`,
    userId
  );

  return holiday;
};

export const removeHoliday = async (id, userId) => {
  const holiday = await Holiday.findById(id);
  if (!holiday) {
    throw new AppError('Holiday not found', 404);
  }

  await Holiday.findByIdAndDelete(id);

  await logAction(
    'DELETE',
    `Holiday '${holiday.name}' on ${holiday.date.toLocaleDateString()} for FY ${holiday.financialYear} was deleted`,
    userId
  );

  return holiday;
};

export const fetchWeekendConfig = async (financialYear) => {
  if (!financialYear) {
    throw new AppError('Financial Year is required', 400);
  }

  let config = await WeekendConfig.findOne({ financialYear });
  if (!config) {
    config = { 
      financialYear, 
      daysConfig: [
        { day: 0, type: 'full' },
        { day: 6, type: 'full' }
      ] 
    };
  }

  return config;
};

export const updateWeekendConfig = async (data, userId) => {
  const { financialYear, daysConfig, autoGenerate } = data;

  if (!financialYear || !Array.isArray(daysConfig)) {
    throw new AppError('Financial Year and daysConfig array are required', 400);
  }

  let config = await WeekendConfig.findOne({ financialYear });
  if (config) {
    config.daysConfig = daysConfig;
    config.createdBy = userId;
    await config.save();
  } else {
    config = await WeekendConfig.create({
      financialYear,
      daysConfig,
      createdBy: userId
    });
  }

  let countGenerated = 0;

  if (autoGenerate) {
    const parts = financialYear.split('-');
    const startYear = parseInt(parts[0]);
    if (isNaN(startYear)) {
      throw new AppError('Invalid Financial Year format. Use YYYY-YY (e.g. 2026-27)', 400);
    }
    
    const startDate = new Date(Date.UTC(startYear, 3, 1, 0, 0, 0, 0)); // April 1st
    const endDate = new Date(Date.UTC(startYear + 1, 2, 31, 23, 59, 59, 999)); // March 31st

    await Holiday.deleteMany({
      financialYear,
      type: { $in: ['weekend', 'half-weekend'] }
    });

    const weekendHolidays = [];
    let current = new Date(startDate);

    const dayNames = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday'
    };

    const configMap = new Map();
    daysConfig.forEach(c => {
      configMap.set(c.day, c.type);
    });

    while (current <= endDate) {
      const dayOfWeek = current.getUTCDay();
      if (configMap.has(dayOfWeek)) {
        const wType = configMap.get(dayOfWeek);
        const dateClone = new Date(current);
        
        weekendHolidays.push({
          name: `${dayNames[dayOfWeek]}${wType === 'half' ? ' (Half Day)' : ''}`,
          date: dateClone,
          type: wType === 'half' ? 'half-weekend' : 'weekend',
          financialYear,
          description: `Auto-generated ${wType === 'half' ? 'half day ' : ''}weekend (${dayNames[dayOfWeek]})`,
          createdBy: userId
        });
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    if (weekendHolidays.length > 0) {
      for (const item of weekendHolidays) {
        try {
          await Holiday.create(item);
          countGenerated++;
        } catch (err) {
          // Ignore duplicates
        }
      }
    }

    const logMsg = `Auto-generated ${countGenerated} weekend entries for FY ${financialYear} (Config: ${daysConfig.map(d => `${dayNames[d.day]} (${d.type})`).join(', ')})`;
    await logAction('WEEKEND_GENERATE', logMsg, userId);
  }

  return { config, countGenerated };
};

export const fetchAuditLogs = async (action, search) => {
  const query = {};

  if (action) {
    query.action = action;
  }

  const logs = await HolidayAuditLog.find(query)
    .populate('performedBy', 'name email role')
    .sort({ timestamp: -1 })
    .limit(100);

  if (search) {
    const regex = new RegExp(search, 'i');
    return logs.filter(log => 
      regex.test(log.details) || 
      (log.performedBy && (
        regex.test(log.performedBy.name) || 
        regex.test(log.performedBy.email)
      ))
    );
  }

  return logs;
};
