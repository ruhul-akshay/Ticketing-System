import Holiday from '../models/Holiday.js';
import WeekendConfig from '../models/WeekendConfig.js';
import HolidayAuditLog from '../models/HolidayAuditLog.js';

// Helper to log audit actions
const logAction = async (action, details, userId) => {
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

// Get all holidays (optionally filter by financial year and search query)
export const getHolidays = async (req, res) => {
  try {
    const { financialYear, search } = req.query;
    const query = {};

    if (financialYear) {
      query.financialYear = financialYear;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const holidays = await Holiday.find(query).sort({ date: 1 });
    res.json({ success: true, holidays });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a holiday
export const createHoliday = async (req, res) => {
  try {
    const { name, date, type, financialYear, description } = req.body;

    if (!name || !date || !financialYear) {
      return res.status(400).json({ success: false, message: 'Name, date, and Financial Year are required' });
    }

    // Parse date to midnight UTC to prevent time zone inconsistencies
    const holidayDate = new Date(date);
    holidayDate.setHours(0, 0, 0, 0);

    // Check duplicate date
    const existing = await Holiday.findOne({ date: holidayDate });
    if (existing) {
      return res.status(400).json({ success: false, message: `A holiday already exists on ${holidayDate.toLocaleDateString()}` });
    }

    const holiday = await Holiday.create({
      name,
      date: holidayDate,
      type: type || 'full',
      financialYear,
      description,
      createdBy: req.user._id
    });

    await logAction(
      'CREATE',
      `Holiday '${name}' (${type || 'full'}) created on ${holidayDate.toLocaleDateString()} for FY ${financialYear}`,
      req.user._id
    );

    res.status(201).json({ success: true, holiday });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a holiday
export const updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, type, financialYear, description } = req.body;

    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }

    let holidayDate = holiday.date;
    if (date) {
      holidayDate = new Date(date);
      holidayDate.setHours(0, 0, 0, 0);

      // Check duplicates
      const duplicate = await Holiday.findOne({ date: holidayDate, _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ success: false, message: `A holiday already exists on ${holidayDate.toLocaleDateString()}` });
      }
    }

    const originalName = holiday.name;
    const originalDate = holiday.date;

    holiday.name = name || holiday.name;
    holiday.date = holidayDate;
    holiday.type = type || holiday.type;
    holiday.financialYear = financialYear || holiday.financialYear;
    holiday.description = description !== undefined ? description : holiday.description;
    holiday.updatedBy = req.user._id;

    await holiday.save();

    await logAction(
      'UPDATE',
      `Holiday updated: '${originalName}' on ${originalDate.toLocaleDateString()} -> '${holiday.name}' on ${holiday.date.toLocaleDateString()}`,
      req.user._id
    );

    res.json({ success: true, holiday });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a holiday
export const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }

    await Holiday.findByIdAndDelete(id);

    await logAction(
      'DELETE',
      `Holiday '${holiday.name}' on ${holiday.date.toLocaleDateString()} for FY ${holiday.financialYear} was deleted`,
      req.user._id
    );

    res.json({ success: true, message: 'Holiday deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get weekend config for a FY
export const getWeekendConfig = async (req, res) => {
  try {
    const { financialYear } = req.query;
    if (!financialYear) {
      return res.status(400).json({ success: false, message: 'Financial Year is required' });
    }

    let config = await WeekendConfig.findOne({ financialYear });
    if (!config) {
      // Return default config (Saturday & Sunday as full)
      config = { 
        financialYear, 
        daysConfig: [
          { day: 0, type: 'full' },
          { day: 6, type: 'full' }
        ] 
      };
    }

    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Save weekend configuration and optionally auto-generate weekend entries
export const saveWeekendConfig = async (req, res) => {
  try {
    const { financialYear, daysConfig, autoGenerate } = req.body;

    if (!financialYear || !Array.isArray(daysConfig)) {
      return res.status(400).json({ success: false, message: 'Financial Year and daysConfig array are required' });
    }

    let config = await WeekendConfig.findOne({ financialYear });
    if (config) {
      config.daysConfig = daysConfig;
      config.createdBy = req.user._id;
      await config.save();
    } else {
      config = await WeekendConfig.create({
        financialYear,
        daysConfig,
        createdBy: req.user._id
      });
    }

    let countGenerated = 0;

    if (autoGenerate) {
      // 1. Determine date range for Financial Year (April 1st to March 31st)
      // Format: "YYYY-YY" e.g., "2026-27"
      const parts = financialYear.split('-');
      const startYear = parseInt(parts[0]);
      if (isNaN(startYear)) {
        return res.status(400).json({ success: false, message: 'Invalid Financial Year format. Use YYYY-YY (e.g. 2026-27)' });
      }
      
      const startDate = new Date(Date.UTC(startYear, 3, 1, 0, 0, 0, 0)); // April 1st
      const endDate = new Date(Date.UTC(startYear + 1, 2, 31, 23, 59, 59, 999)); // March 31st

      // 2. Remove existing weekend/half-weekend entries for this FY
      await Holiday.deleteMany({
        financialYear,
        type: { $in: ['weekend', 'half-weekend'] }
      });

      // 3. Generate weekend dates
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
          const wType = configMap.get(dayOfWeek); // 'full' or 'half'
          const dateClone = new Date(current);
          
          weekendHolidays.push({
            name: `${dayNames[dayOfWeek]}${wType === 'half' ? ' (Half Day)' : ''}`,
            date: dateClone,
            type: wType === 'half' ? 'half-weekend' : 'weekend',
            financialYear,
            description: `Auto-generated ${wType === 'half' ? 'half day ' : ''}weekend (${dayNames[dayOfWeek]})`,
            createdBy: req.user._id
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
            // Ignore manual holiday date overlap duplicates
          }
        }
      }

      const logMsg = `Auto-generated ${countGenerated} weekend entries for FY ${financialYear} (Config: ${daysConfig.map(d => `${dayNames[d.day]} (${d.type})`).join(', ')})`;
      await logAction(
        'WEEKEND_GENERATE',
        logMsg,
        req.user._id
      );
    }

    res.json({ 
      success: true, 
      config, 
      message: autoGenerate 
        ? `Weekend configuration saved and ${countGenerated} weekend entries generated successfully.` 
        : 'Weekend configuration saved successfully.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get audit logs
export const getAuditLogs = async (req, res) => {
  try {
    const { action, search } = req.query;
    const query = {};

    if (action) {
      query.action = action;
    }

    const logs = await HolidayAuditLog.find(query)
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 })
      .limit(100);

    // If search term exists, filter logs by performedBy name/email or details
    let filteredLogs = logs;
    if (search) {
      const regex = new RegExp(search, 'i');
      filteredLogs = logs.filter(log => 
        regex.test(log.details) || 
        regex.test(log.performedBy?.name) || 
        regex.test(log.performedBy?.email)
      );
    }

    res.json({ success: true, logs: filteredLogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
