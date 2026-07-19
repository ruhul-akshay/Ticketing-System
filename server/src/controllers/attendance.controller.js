import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Holiday from '../models/Holiday.js';
import ClientUser from '../models/ClientUser.js';

// Helper to truncate date to midnight UTC
const getMidnightUTC = (dateStr) => {
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
};

// Helper to get dates in month
const getDatesInMonth = (year, month) => {
  const dates = [];
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  
  let current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return { dates, start, end };
};

// Check-in daily
export const checkIn = async (req, res) => {
  try {
    const todayMidnight = getMidnightUTC(new Date());

    // Check if already checked in today
    const existing = await Attendance.findOne({ user: req.user._id, date: todayMidnight });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already checked in today.' });
    }

    const attendance = await Attendance.create({
      user: req.user._id,
      date: todayMidnight,
      status: 'present',
      checkIn: new Date(),
      remarks: req.body.remarks || ''
    });

    res.status(201).json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check-out daily
export const checkOut = async (req, res) => {
  try {
    const todayMidnight = getMidnightUTC(new Date());

    const attendance = await Attendance.findOne({ user: req.user._id, date: todayMidnight });
    if (!attendance) {
      return res.status(400).json({ success: false, message: 'No check-in record found for today.' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ success: false, message: 'You have already checked out today.' });
    }

    const now = new Date();
    attendance.checkOut = now;
    attendance.status = 'present';
    
    // Calculate duration in minutes
    const diffMs = now.getTime() - attendance.checkIn.getTime();
    attendance.duration = Math.round(diffMs / 1000 / 60);

    await attendance.save();

    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Request a leave
export const requestLeave = async (req, res) => {
  try {
    const { startDate, endDate, type, reason } = req.body;

    if (!startDate || !endDate || !type || !reason) {
      return res.status(400).json({ success: false, message: 'All fields (startDate, endDate, type, reason) are required.' });
    }

    const start = getMidnightUTC(startDate);
    const end = getMidnightUTC(endDate);

    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
    }

    const leave = await LeaveRequest.create({
      user: req.user._id,
      startDate: start,
      endDate: end,
      type,
      reason
    });

    res.status(201).json({ success: true, leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get monthly attendance summary with dynamic holiday and weekend logic
export const getMonthlySummary = async (req, res) => {
  try {
    const userId = req.query.userId || req.user._id;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) - 1; // 0-indexed month

    if (isNaN(month) || month < 0 || month > 11) {
      return res.status(400).json({ success: false, message: 'Invalid year or month' });
    }

    const { dates, start, end } = getDatesInMonth(year, month);

    // 1. Fetch check-in records
    const attendanceRecords = await Attendance.find({
      user: userId,
      date: { $gte: start, $lte: end }
    });

    // 2. Fetch all holidays and weekends in this month
    const holidays = await Holiday.find({
      date: { $gte: start, $lte: end }
    });

    // 3. Fetch approved leave requests that overlap with this month
    const leaves = await LeaveRequest.find({
      user: userId,
      status: 'approved',
      $or: [
        { startDate: { $gte: start, $lte: end } },
        { endDate: { $gte: start, $lte: end } },
        { startDate: { $lte: start }, endDate: { $gte: end } }
      ]
    });

    // Map database items for fast lookup by ISO date string (YYYY-MM-DD)
    const attendanceMap = new Map();
    attendanceRecords.forEach(a => {
      const dateStr = a.date.toISOString().split('T')[0];
      attendanceMap.set(dateStr, a);
    });

    const holidayMap = new Map();
    holidays.forEach(h => {
      const dateStr = h.date.toISOString().split('T')[0];
      holidayMap.set(dateStr, h);
    });

    // Function to check if a date falls under approved leaves
    const getApprovedLeave = (date) => {
      const midnight = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
      return leaves.find(l => midnight >= l.startDate && midnight <= l.endDate);
    };

    const todayMidnight = getMidnightUTC(new Date());
    const monthlyList = [];
    
    // Stats accumulators
    let totalDays = dates.length;
    let weekends = 0;
    let holidaysCount = 0;
    let present = 0;
    let absent = 0;
    let leave = 0;
    let halfDayHoliday = 0;
    
    dates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const isPast = date < todayMidnight;
      const isToday = date.getTime() === todayMidnight.getTime();
      
      const attRecord = attendanceMap.get(dateStr);
      const holidayRecord = holidayMap.get(dateStr);
      const leaveRecord = getApprovedLeave(date);
      
      let dayStatus = 'absent';
      let checkInTime = null;
      let checkOutTime = null;
      let duration = null;
      let remarks = '';
      let holidayName = '';
      
      if (attRecord) {
        dayStatus = 'present';
        checkInTime = attRecord.checkIn;
        checkOutTime = attRecord.checkOut;
        duration = attRecord.duration;
        remarks = attRecord.remarks;
        present++;
      } else {
        if (holidayRecord) {
          if (holidayRecord.type === 'weekend') {
            dayStatus = 'weekend';
            weekends++;
          } else if (holidayRecord.type === 'half-weekend') {
            dayStatus = 'half-weekend';
            weekends += 0.5;
            
            if (isPast) {
              absent += 0.5; // Counts as half-day absent if they didn't check in
            }
          } else if (holidayRecord.type === 'half') {
            // Half day holiday: counted as 0.5 working day, 0.5 holiday
            // If they are absent, they get marked as half-day-holiday
            dayStatus = 'half-day-holiday';
            holidayName = holidayRecord.name;
            halfDayHoliday++;
            holidaysCount += 0.5;
            
            if (isPast) {
              absent += 0.5; // Counts as half-day absent
            }
          } else {
            dayStatus = 'holiday';
            holidayName = holidayRecord.name;
            holidaysCount++;
          }
        } else if (leaveRecord) {
          dayStatus = 'leave';
          leave++;
        } else {
          if (isToday) {
            dayStatus = 'pending';
          } else if (isPast) {
            dayStatus = 'absent';
            absent++;
          } else {
            dayStatus = 'future';
          }
        }
      }
      
      monthlyList.push({
        date: dateStr,
        status: dayStatus,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        duration,
        remarks,
        holidayName: holidayRecord?.name || ''
      });
    });

    const workingDays = totalDays - weekends - Math.floor(holidaysCount);

    res.json({
      success: true,
      summary: {
        totalDays,
        workingDays: Math.max(workingDays, 0),
        present,
        absent,
        leave,
        holidays: holidaysCount,
        weekends
      },
      attendanceList: monthlyList
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all leave requests (Super Admin / Admin view)
export const getAllLeaves = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const leaves = await LeaveRequest.find(query)
      .populate('user', 'name email employeeCode role department')
      .sort({ createdAt: -1 });

    let filteredLeaves = leaves;
    if (search) {
      const regex = new RegExp(search, 'i');
      filteredLeaves = leaves.filter(l => 
        regex.test(l.reason) || 
        regex.test(l.user?.name) || 
        regex.test(l.user?.email) || 
        regex.test(l.user?.employeeCode)
      );
    }

    res.json({ success: true, leaves: filteredLeaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve or reject leave
export const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be approved or rejected.' });
    }

    const leave = await LeaveRequest.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    leave.status = status;
    await leave.save();

    res.json({ success: true, leave, message: `Leave request has been ${status}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get leave history for logged-in user
export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
