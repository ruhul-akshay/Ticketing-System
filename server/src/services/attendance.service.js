import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Holiday from '../models/Holiday.js';
import { AppError } from '../utils/AppError.js';

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

export const performCheckIn = async (userId, remarks) => {
  const todayMidnight = getMidnightUTC(new Date());

  // Check if already checked in today
  const existing = await Attendance.findOne({ user: userId, date: todayMidnight });
  if (existing) {
    throw new AppError('You have already checked in today.', 400);
  }

  return await Attendance.create({
    user: userId,
    date: todayMidnight,
    status: 'present',
    checkIn: new Date(),
    remarks: remarks || ''
  });
};

export const performCheckOut = async (userId) => {
  const todayMidnight = getMidnightUTC(new Date());

  const attendance = await Attendance.findOne({ user: userId, date: todayMidnight });
  if (!attendance) {
    throw new AppError('No check-in record found for today.', 400);
  }

  if (attendance.checkOut) {
    throw new AppError('You have already checked out today.', 400);
  }

  const now = new Date();
  attendance.checkOut = now;
  attendance.status = 'present';
  
  // Calculate duration in minutes
  const diffMs = now.getTime() - attendance.checkIn.getTime();
  attendance.duration = Math.round(diffMs / 1000 / 60);

  await attendance.save();
  return attendance;
};

export const performRequestLeave = async (userId, { startDate, endDate, type, reason }) => {
  if (!startDate || !endDate || !type || !reason) {
    throw new AppError('All fields (startDate, endDate, type, reason) are required.', 400);
  }

  const start = getMidnightUTC(startDate);
  const end = getMidnightUTC(endDate);

  if (end < start) {
    throw new AppError('End date cannot be before start date.', 400);
  }

  return await LeaveRequest.create({
    user: userId,
    startDate: start,
    endDate: end,
    type,
    reason
  });
};

export const calculateMonthlySummary = async (userId, year, monthInput) => {
  const month = parseInt(monthInput) - 1; // 0-indexed month

  if (isNaN(month) || month < 0 || month > 11) {
    throw new AppError('Invalid year or month', 400);
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

  return {
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
  };
};

export const fetchAllLeaves = async (status, search) => {
  const query = {};

  if (status) {
    query.status = status;
  }

  const leaves = await LeaveRequest.find(query)
    .populate('user', 'name email employeeCode role department')
    .sort({ createdAt: -1 });

  if (search) {
    const regex = new RegExp(search, 'i');
    return leaves.filter(l => 
      regex.test(l.reason) || 
      (l.user && (
        regex.test(l.user.name) || 
        regex.test(l.user.email) || 
        regex.test(l.user.employeeCode)
      ))
    );
  }

  return leaves;
};

export const updateLeaveStatus = async (id, status) => {
  if (!['approved', 'rejected'].includes(status)) {
    throw new AppError('Invalid status. Must be approved or rejected.', 400);
  }

  const leave = await LeaveRequest.findById(id);
  if (!leave) {
    throw new AppError('Leave request not found.', 404);
  }

  leave.status = status;
  await leave.save();
  return leave;
};

export const fetchMyLeaves = async (userId) => {
  return await LeaveRequest.find({ user: userId }).sort({ createdAt: -1 });
};
